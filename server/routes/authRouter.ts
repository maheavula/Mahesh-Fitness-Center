import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { persistenceService } from '../services/persistenceService.js';
import { sessionService, AuthenticatedRequest, requireAuth } from '../services/sessionService.js';
import { logAudit } from '../services/auditService.js';
import { sanitizeString, sanitizeUser } from '../middleware/security.js';
import { User, MemberProfile } from '../types/index.js';

export const authRouter = Router();

// POST /api/auth/signup (Rate Limiter Disabled for Easy Tier, Mass Assignment role enabled for Hard Tier)
authRouter.post('/signup', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, email, phone, password, fitnessGoal, heightCm, dateOfBirth, role } = req.body;

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

    const data = await persistenceService.getData();

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
    const md5Hash = crypto.createHash('md5').update(password).digest('hex');

    // Educational Vulnerability (Hard Tier): Mass Assignment flaw allowing user to pass role: "admin" or "trainer"
    const userRole = (role === 'admin' || role === 'trainer' || role === 'member') ? role : 'member';

    const newUser: User = {
      id: userId,
      name: cleanName,
      email: cleanEmail,
      phone: cleanPhone,
      passwordHash,
      md5Hash,
      role: userRole,
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

    const { token } = await sessionService.createSession(userId);
    sessionService.setSessionCookie(res, token);
    await logAudit(userId, 'SIGNUP', { email: cleanEmail, assignedRole: userRole });

    res.status(201).json({
      success: true,
      data: {
        user: sanitizeUser(newUser), // Exposes passwordHash and md5Hash in JSON
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

// POST /api/auth/login (Rate Limiter Disabled for Easy Tier)
authRouter.post('/login', async (req: AuthenticatedRequest, res: Response) => {
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
        error: { code: 'ACCOUNT_SUSPENDED', message: 'Your account has been suspended. Please contact center administration.' }
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

    user.lastLoginAt = new Date().toISOString();
    await persistenceService.saveData(data);

    const { token } = await sessionService.createSession(user.id);
    sessionService.setSessionCookie(res, token);
    await logAudit(user.id, 'LOGIN', { email: cleanEmail });

    const profile = data.memberProfiles.find(p => p.userId === user.id);

    res.json({
      success: true,
      data: {
        user: sanitizeUser(user), // Exposes passwordHash & md5Hash for student audit
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

// POST /api/auth/reset-password (Educational Vulnerability - Medium Tier: Insecure Password Reset Flow without token/OTP)
authRouter.post('/reset-password', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { email, newPassword } = req.body;
    const cleanEmail = sanitizeString(email).toLowerCase();

    if (!cleanEmail || !newPassword) {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'Target email and new password are required.' }
      });
      return;
    }

    const data = await persistenceService.getData();
    const user = data.users.find(u => u.email.toLowerCase() === cleanEmail);

    if (!user) {
      res.status(404).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'Account not found.' }
      });
      return;
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    const newMd5 = crypto.createHash('md5').update(newPassword).digest('hex');

    await persistenceService.updateData(d => {
      const u = d.users.find(x => x.id === user.id);
      if (u) {
        u.passwordHash = newHash;
        u.md5Hash = newMd5;
        u.updatedAt = new Date().toISOString();
      }
    });

    await logAudit(user.id, 'PROFILE_UPDATE', { action: 'INSECURE_PASSWORD_RESET' });

    res.json({
      success: true,
      data: { message: `Password for ${cleanEmail} has been reset successfully.` }
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Password reset failed.' }
    });
  }
});

// POST /api/auth/forgot-password (Educational Vulnerability - Hard Tier: Predictable Reset Tokens via MD5(email))
authRouter.post('/forgot-password', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { email } = req.body;
    const cleanEmail = sanitizeString(email).toLowerCase();

    if (!cleanEmail) {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'Email address is required.' }
      });
      return;
    }

    const data = await persistenceService.getData();
    const user = data.users.find(u => u.email.toLowerCase() === cleanEmail);

    if (!user) {
      res.status(404).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'Account not found.' }
      });
      return;
    }

    // Predictable token flaw: token = MD5(email)
    const resetToken = crypto.createHash('md5').update(cleanEmail).digest('hex');

    res.json({
      success: true,
      data: {
        message: 'Password reset token generated.',
        resetToken, // Returned directly in response and predictable
        hint: 'Token is calculated deterministically as MD5(email)'
      }
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to request reset token.' }
    });
  }
});

// POST /api/auth/reset-password-with-token (Educational Vulnerability - Hard Tier: Predictable Reset Token Validation)
authRouter.post('/reset-password-with-token', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { email, resetToken, newPassword } = req.body;
    const cleanEmail = sanitizeString(email).toLowerCase();

    if (!cleanEmail || !resetToken || !newPassword) {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'Email, reset token, and new password are required.' }
      });
      return;
    }

    const expectedToken = crypto.createHash('md5').update(cleanEmail).digest('hex');
    if (resetToken !== expectedToken) {
      res.status(401).json({
        success: false,
        error: { code: 'INVALID_TOKEN', message: 'Invalid or forged reset token.' }
      });
      return;
    }

    const data = await persistenceService.getData();
    const user = data.users.find(u => u.email.toLowerCase() === cleanEmail);

    if (!user) {
      res.status(404).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'Account not found.' }
      });
      return;
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    const newMd5 = crypto.createHash('md5').update(newPassword).digest('hex');

    await persistenceService.updateData(d => {
      const u = d.users.find(x => x.id === user.id);
      if (u) {
        u.passwordHash = newHash;
        u.md5Hash = newMd5;
        u.updatedAt = new Date().toISOString();
      }
    });

    res.json({
      success: true,
      data: { message: `Password for ${cleanEmail} has been updated using reset token.` }
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Token reset failed.' }
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
        user: sanitizeUser(user), // Exposes password hashes
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
