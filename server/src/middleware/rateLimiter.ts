import { Request, Response, NextFunction } from 'express';

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

const WINDOW_MS = 60 * 1000; // 1 minute window
const MAX_REQUESTS = 120; // 120 requests per minute per IP

/**
 * Lightweight API Rate Limiting Middleware
 * Protects backend API endpoints against abuse/DDoS
 */
export const rateLimiter = (req: Request, res: Response, next: NextFunction) => {
  const ip = req.ip || req.headers['x-forwarded-for'] as string || 'unknown';
  const now = Date.now();

  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + WINDOW_MS });
    return next();
  }

  record.count += 1;

  if (record.count > MAX_REQUESTS) {
    return res.status(429).json({
      success: false,
      message: 'Too many requests from this IP. Please try again in 1 minute.',
      retryAfterSeconds: Math.ceil((record.resetTime - now) / 1000)
    });
  }

  next();
};
