import { Request, Response, NextFunction } from 'express';
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss';

export const sanitizeMongoQuery = mongoSanitize({
    onSanitize: ({ key }) => {
      console.warn('Attempted NoSQL injection detected:', key); // Debug log
    }
  });

  export const sanitizeInput = (req: Request, _res: Response, next: NextFunction) => {
    if (req.body) {
      Object.keys(req.body).forEach(key => {
        if (typeof req.body[key] === 'string') {
          req.body[key] = xss(req.body[key]);
        }
      });
    }
    next();
  };