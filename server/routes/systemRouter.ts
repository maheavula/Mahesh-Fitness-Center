import { Router, Response } from 'express';
import { persistenceService } from '../services/persistenceService.js';
import { AuthenticatedRequest, sessionService } from '../services/sessionService.js';

export const systemRouter = Router();

// GET /api/system/session
systemRouter.get('/session', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const token = sessionService.extractTokenFromRequest(req);
    if (!token) {
      res.json({
        success: true,
        data: { authenticated: false, session: null, user: null }
      });
      return;
    }

    const sessionData = await sessionService.getSession(token);
    if (!sessionData) {
      res.json({
        success: true,
        data: { authenticated: false, session: null, user: null }
      });
      return;
    }

    const safeUser = {
      id: sessionData.user.id,
      name: sessionData.user.name,
      email: sessionData.user.email,
      phone: sessionData.user.phone,
      role: sessionData.user.role,
      status: sessionData.user.status
    };

    res.json({
      success: true,
      data: {
        authenticated: true,
        session: sessionData.session,
        user: safeUser
      }
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: err.message }
    });
  }
});

// POST /api/system/session/refresh
systemRouter.post('/session/refresh', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const token = sessionService.extractTokenFromRequest(req);
    if (!token) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'No active session token found.' }
      });
      return;
    }

    const sessionData = await sessionService.getSession(token);
    if (!sessionData) {
      res.status(401).json({
        success: false,
        error: { code: 'SESSION_EXPIRED', message: 'Session expired or invalid.' }
      });
      return;
    }

    // Refresh expiration (+24h)
    const newExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    await persistenceService.updateData(d => {
      const sess = d.sessions.find(s => s.id === token);
      if (sess) {
        sess.expiresAt = newExpiresAt;
        sess.lastActivityAt = new Date().toISOString();
      }
    });

    res.json({
      success: true,
      data: {
        message: 'Session refreshed successfully.',
        expiresAt: newExpiresAt
      }
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: err.message }
    });
  }
});

// GET /api/system/health
systemRouter.get('/health', async (req: AuthenticatedRequest, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// GET /api/system/info
systemRouter.get('/info', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const data = await persistenceService.getData();

    res.json({
      success: true,
      data: {
        application: 'Mahesh Fitness Center',
        mode: 'Simulator',
        status: 'Online',
        persistence: 'runtime.json',
        apiGroups: 6,
        version: '1.0.0',
        uptime: Math.round(process.uptime()),
        stats: {
          totalUsers: data.users.length,
          activeMembers: data.users.filter(u => u.role === 'member' && u.status === 'active').length,
          activePlans: data.membershipPlans.filter(p => p.status === 'active').length,
          totalClasses: data.classes.length,
          totalBookings: data.bookings.length
        }
      }
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: err.message }
    });
  }
});
