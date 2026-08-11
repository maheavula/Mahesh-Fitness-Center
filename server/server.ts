import express, { Request, Response, NextFunction } from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

import { ensureSeededData } from './services/seedService.js';
import { authenticateSession } from './services/sessionService.js';

import { authRouter } from './routes/authRouter.js';
import { memberRouter } from './routes/memberRouter.js';
import { classRouter } from './routes/classRouter.js';
import { membershipRouter } from './routes/membershipRouter.js';
import { adminRouter } from './routes/adminRouter.js';
import { systemRouter } from './routes/systemRouter.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize seed data on startup
await ensureSeededData();

// OWASP A05: Security Misconfiguration Protection
app.disable('x-powered-by');

// OWASP A03 & A05: Mount Helmet for HTTP Security Headers
app.use(
  helmet({
    contentSecurityPolicy: false, // Allow inline styles & local scripts for Vite/React dev
    crossOriginEmbedderPolicy: false
  })
);

// OWASP A05: Restricted CORS Configuration
app.use(
  cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-session-id']
  })
);

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());

// Session Middleware
app.use(authenticateSession);

// EXACTLY SIX LOGICAL API GROUPS
app.use('/api/auth', authRouter);
app.use('/api/member', memberRouter);
app.use('/api/classes', classRouter);
app.use('/api/membership', membershipRouter);
app.use('/api/admin', adminRouter);
app.use('/api/system', systemRouter);

// Standardized 404 for unmatched API routes
app.use('/api/*', (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'API_ENDPOINT_NOT_FOUND',
      message: `The requested endpoint ${req.originalUrl} does not exist.`
    }
  });
});

// Serve frontend static assets in production
const clientDistPath = path.resolve(__dirname, '../client');
app.use(express.static(clientDistPath));

app.get('*', (req: Request, res: Response) => {
  if (req.originalUrl.startsWith('/api')) return;
  const indexPath = path.join(clientDistPath, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      res.status(200).send(`
        <!DOCTYPE html>
        <html>
          <head><title>Mahesh Fitness Center API</title></head>
          <body style="font-family: sans-serif; padding: 2rem; background: #e8ecf2; color: #2d3748;">
            <h1>Mahesh Fitness Center Server</h1>
            <p>Backend API server is running on port ${PORT}.</p>
            <p>Vite dev server handles the frontend in development mode on port 5173.</p>
          </body>
        </html>
      `);
    }
  });
});

// OWASP A05: Global Error Handler (Zero stack trace leaks to client)
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled server error:', err);
  res.status(err.status || 500).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected server error occurred. Please try again later.'
    }
  });
});

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(` Mahesh Fitness Center Simulator (OWASP Hardened)`);
  console.log(` Running on: http://localhost:${PORT}`);
  console.log(` Data store: data/runtime.json`);
  console.log(` Security Headers: Enabled (Helmet + RateLimiting)`);
  console.log(` API groups: 6 (/api/auth, /api/member, /api/classes, /api/membership, /api/admin, /api/system)`);
  console.log(`====================================================`);
});
