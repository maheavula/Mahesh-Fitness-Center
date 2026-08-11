import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { persistenceService } from '../services/persistenceService.js';
import { sessionService, AuthenticatedRequest, requireAuth } from '../services/sessionService.js';
import { logAudit } from '../services/auditService.js';
import { User, MemberProfile } from '../types/index.js';

export const authRouter = Router();

// POST /api/auth/signup
authRouter.post('/signup', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, email, phone, password, fitnessGoal, heightCm, dateOfBirth } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'Name, email, and password are required.' }
      });
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    const data = await persistenceService.getData();

    // Check duplicate
    const existing = data.users.find(u => u.email.toLowerCase() === cleanEmail);
    if (existing) {
      res.status(409).json({
        success: false,
        error: { code: 'DUPLICATE_EMAIL', message: 'An account with this email already exists.' }
      });
      return;
    }

    const now = new Date().toISOString();
    const userId = 'USR-' + Math.floor(10000 + Math.random() * 90000);
    const memberId = 'MEM-' + Math.floor(10000 + Math.random() * 90000);
    const passwordHash = await bcrypt.hash(password, 10);

    const newUser: User = {
      id: userId,
      name: name.trim(),
      email: cleanEmail,
      phone: phone ? phone.trim() : '',
      passwordHash,
      role: 'member',
      status: 'active',
      createdAt: now,
      updatedAt: now,
      lastLoginAt: now
    };

    const newProfile: MemberProfile = {
      id: memberId,
      userId,
      fitnessGoal: fitnessGoal || 'fitness',
      heightCm: heightCm ? Number(heightCm) : undefined,
      dateOfBirth: dateOfBirth || undefined,
      createdAt: now,
      updatedAt: now
    };

    await persistenceService.updateData(d => {
      d.users.push(newUser);
      d.memberProfiles.push(newProfile);
    });

    const { session, token } = await sessionService.createSession(userId);
    sessionService.setSessionCookie(res, token);
    await logAudit(userId, 'SIGNUP', { email: cleanEmail });

    const safeUser = {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      phone: newUser.phone,
      role: newUser.role,
      status: newUser.status,
      createdAt: newUser.createdAt
    };

    res.status(201).json({
      success: true,
      data: {
        user: safeUser,
        profile: newProfile,
        token
      }
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: err.message || 'Signup failed' }
    });
  }
});

// POST /api/auth/login
authRouter.post('/login', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'Email and password are required.' }
      });
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    const data = await persistenceService.getData();
    const user = data.users.find(u => u.email.toLowerCase() === cleanEmail);

    if (!user) {
      res.status(401).json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' }
      });
      return;
    }

    if (user.status === 'suspended') {
      res.status(403).json({
        success: false,
        error: { code: 'ACCOUNT_SUSPENDED', message: 'Your account is suspended. Contact administration.' }
      });
      return;
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      res.status(401).json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' }
      });
      return;
    }

    // Update last login time
    user.lastLoginAt = new Date().toISOString();
    await persistenceService.saveData(data);

    const { token } = await sessionService.createSession(user.id);
    sessionService.setSessionCookie(res, token);
    await logAudit(user.id, 'LOGIN', { email: cleanEmail });

    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      status: user.status,
      lastLoginAt: user.lastLoginAt
    };

    const profile = data.memberProfiles.find(p => p.userId === user.id);

    res.json({
      success: true,
      data: {
        user: safeUser,
        profile,
        token
      }
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: err.message || 'Login failed' }
    });
  }
});

// POST /api/auth/logout
authRouter.post('/logout', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const token = sessionService.extractTokenFromRequest(req);
    if (token) {
      await sessionService.destroySession(token);
    }
    sessionService.clearSessionCookie(res);
    if (req.user) {
      await logAudit(req.user.id, 'LOGOUT');
    }

    res.json({
      success: true,
      data: { message: 'Logged out successfully.' }
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Logout failed' }
    });
  }
});

// GET /api/auth/me
authRouter.get('/me', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const data = await persistenceService.getData();
    const profile = data.memberProfiles.find(p => p.userId === user.id);

    let activeSubscription: any = null;
    if (profile) {
      activeSubscription = data.memberships.find(m => m.memberId === profile.id && m.status === 'active');
      if (activeSubscription) {
        const plan = data.membershipPlans.find(p => p.id === activeSubscription?.planId);
        activeSubscription.plan = plan;
      }
    }

    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt
    };

    res.json({
      success: true,
      data: {
        user: safeUser,
        profile,
        subscription: activeSubscription
      }
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to fetch user session' }
    });
  }
});
