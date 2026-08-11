import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { persistenceService } from '../services/persistenceService.js';
import { sessionService, AuthenticatedRequest, requireAuth } from '../services/sessionService.js';
import { logAudit } from '../services/auditService.js';
import { authRateLimiter, sanitizeString, sanitizeUser, validatePasswordStrength } from '../middleware/security.js';
import { User, MemberProfile } from '../types/index.js';

export const authRouter = Router();

// POST /api/auth/signup
authRouter.post('/signup', authRateLimiter, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, email, phone, password, fitnessGoal, heightCm, dateOfBirth } = req.body;

    const cleanName = sanitizeString(name);
    const cleanEmail = sanitizeString(email).toLowerCase();
    const cleanPhone = sanitizeString(phone);

    if (!cleanName || !cleanEmail || !password) {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'Name, valid email, and password are required.' }
      });
      return;
    }

    // OWASP A07: Password Strength Check
    const passCheck = validatePasswordStrength(password);
    if (!passCheck.valid) {
      res.status(400).json({
        success: false,
        error: { code: 'WEAK_PASSWORD', message: passCheck.message }
      });
      return;
    }

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
      name: cleanName,
      email: cleanEmail,
      phone: cleanPhone,
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
      fitnessGoal: (sanitizeString(fitnessGoal) as any) || 'fitness',
      heightCm: heightCm ? Number(heightCm) : undefined,
      dateOfBirth: dateOfBirth ? sanitizeString(dateOfBirth) : undefined,
      createdAt: now,
      updatedAt: now
    };

    await persistenceService.updateData(d => {
      d.users.push(newUser);
      d.memberProfiles.push(newProfile);
    });

    // OWASP A07: Session Fixation Defense - Destroy previous session if present
    const existingToken = sessionService.extractTokenFromRequest(req);
    if (existingToken) {
      await sessionService.destroySession(existingToken);
    }

    const { token } = await sessionService.createSession(userId);
    sessionService.setSessionCookie(res, token);
    await logAudit(userId, 'SIGNUP', { email: cleanEmail });

    res.status(201).json({
      success: true,
      data: {
        user: sanitizeUser(newUser),
        profile: newProfile,
        token
      }
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Signup failed. Please try again.' }
    });
  }
});

// POST /api/auth/login
authRouter.post('/login', authRateLimiter, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { email, password } = req.body;

    const cleanEmail = sanitizeString(email).toLowerCase();

    if (!cleanEmail || !password) {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'Email and password are required.' }
      });
      return;
    }

    const data = await persistenceService.getData();
    const user = data.users.find(u => u.email.toLowerCase() === cleanEmail);

    // OWASP A07: Generic error message to prevent email enumeration
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
        error: { code: 'ACCOUNT_SUSPENDED', message: 'Your account has been suspended. Please contact administration.' }
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

    // OWASP A07: Session Fixation Defense - Rotate session ID on authentication
    const existingToken = sessionService.extractTokenFromRequest(req);
    if (existingToken) {
      await sessionService.destroySession(existingToken);
    }

    const { token } = await sessionService.createSession(user.id);
    sessionService.setSessionCookie(res, token);
    await logAudit(user.id, 'LOGIN', { email: cleanEmail });

    const profile = data.memberProfiles.find(p => p.userId === user.id);

    res.json({
      success: true,
      data: {
        user: sanitizeUser(user),
        profile,
        token
      }
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Login failed. Please try again.' }
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

    res.json({
      success: true,
      data: {
        user: sanitizeUser(user),
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
