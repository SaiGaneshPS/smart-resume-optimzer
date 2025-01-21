import { Request } from 'express';
import { IUserDocument } from '../models/User';

export interface ExtendedRateLimitInfo {
  increment?: () => void;
  remaining?: number;
  resetTime?: Date;  
  limit?: number;
  used?: number;
  current?: number;
}

export interface AuthenticatedRequest extends Request {
  user?: IUserDocument;
  rateLimit?: ExtendedRateLimitInfo;
}
