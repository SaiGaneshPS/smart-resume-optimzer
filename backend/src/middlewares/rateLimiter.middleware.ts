import rateLimit from 'express-rate-limit';
import { Request, Response} from 'express';

// Login attempts limiter
export const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per window per IP
    message: { error: 'Too many login attempts, please try again after 15 minutes' },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true,
    handler: (_req: Request, res: Response) => {
      res.status(429).json({ 
        error: 'Too many login attempts, please try again after 15 minutes'
      });
    }
  });

// Registration limiter
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 registration attempts per hour per IP
  message: { error: 'Too many registration attempts, please try again after an hour' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Password reset request limiter
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 password reset attempts per hour per IP
  message: { error: 'Too many password reset attempts, please try again after an hour' },
  standardHeaders: true,
  legacyHeaders: false,
});
