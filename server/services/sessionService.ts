import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { persistenceService } from './persistenceService.js';
import { Session, User } from '../types/index.js';

const SESSION_COOKIE_NAME = 'mfc_session_id';
const SESSION_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

export interface AuthenticatedRequest extends Request {
  session?: Session;
  user?: User;
}

export class SessionService {
  public async createSession(userId: string): Promise<{ session: Session; token: string }> {
    const token = 'MFC_SESS_' + crypto.randomBytes(32).toString('hex');
    const now = new Date();
    const expiresAt = new Date(now.getTime() + SESSION_EXPIRY_MS).toISOString();

    const session: Session = {
      id: token,
      userId,
      createdAt: now.toISOString(),
      expiresAt,
      lastActivityAt: now.toISOString()
    };

    await persistenceService.updateData(data => {
      // Remove any expired sessions
      const validSessions = data.sessions.filter(s => new Date(s.expiresAt) > new Date());
      validSessions.push(session);
      data.sessions = validSessions;
    });

    return { session, token };
  }

  public async getSession(token: string): Promise<{ session: Session; user: User } | null> {
    if (!token) return null;
    const data = await persistenceService.getData();
    const session = data.sessions.find(s => s.id === token);

    if (!session) return null;

    if (new Date(session.expiresAt) < new Date()) {
      // Expired session
      await this.destroySession(token);
      return null;
    }

    const user = data.users.find(u => u.id === session.userId);
    if (!user || user.status === 'suspended') {
      await this.destroySession(token);
      return null;
    }

    // Touch lastActivityAt
    session.lastActivityAt = new Date().toISOString();
    await persistenceService.saveData(data);

    return { session, user };
  }

  public async destroySession(token: string): Promise<void> {
    await persistenceService.updateData(data => {
      data.sessions = data.sessions.filter(s => s.id !== token);
    });
  }

  public async destroyUserSessions(userId: string): Promise<void> {
    await persistenceService.updateData(data => {
      data.sessions = data.sessions.filter(s => s.userId !== userId);
    });
  }

  public setSessionCookie(res: Response, token: string): void {
    res.cookie(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_EXPIRY_MS
    });
  }

  public clearSessionCookie(res: Response): void {
    res.clearCookie(SESSION_COOKIE_NAME, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });
  }

  public extractTokenFromRequest(req: Request): string | null {
    if (req.cookies && req.cookies[SESSION_COOKIE_NAME]) {
      return req.cookies[SESSION_COOKIE_NAME];
    }
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }
    const headerToken = req.headers['x-session-id'];
    if (typeof headerToken === 'string') {
      return headerToken;
    }
    return null;
  }
}

export const sessionService = new SessionService();

// Middleware: Authenticate Session
export async function authenticateSession(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const token = sessionService.extractTokenFromRequest(req);
  if (!token) {
    next();
    return;
  }

  const sessionData = await sessionService.getSession(token);
  if (sessionData) {
    req.session = sessionData.session;
    req.user = sessionData.user;
  }

  next();
}

// Middleware: Require Auth
export function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.session || !req.user) {
    res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required. Please log in.'
      }
    });
    return;
  }

  if (req.user.status === 'suspended') {
    res.status(403).json({
      success: false,
      error: {
        code: 'ACCOUNT_SUSPENDED',
        message: 'Your account has been suspended. Please contact center administration.'
      }
    });
    return;
  }

  next();
}

// Middleware: Require Role
export function requireRole(role: 'admin' | 'member') {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user || req.user.role !== role) {
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: `Access denied. Requires ${role} administrative permissions.`
        }
      });
      return;
    }
    next();
  };
}
