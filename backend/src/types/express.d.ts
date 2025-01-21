import { ExtendedRateLimitInfo } from './custom.types';

declare global {
  namespace Express {
    interface Request {
      rateLimit?: ExtendedRateLimitInfo;
    }
  }
}

export {};
