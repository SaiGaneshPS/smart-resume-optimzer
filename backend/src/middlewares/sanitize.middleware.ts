import { Request, Response, NextFunction } from 'express';
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss';

export const sanitizeMongoQuery = mongoSanitize({
    onSanitize: ({ key }) => {
        console.warn('Attempted NoSQL injection detected:', key);
    }
});

export const sanitizeInput = (req: Request, _res: Response, next: NextFunction) => {
    if (req.body) {
        // Don't sanitize password fields
        const skipFields = ['password', 'currentPassword', 'newPassword'];
        
        Object.keys(req.body).forEach(key => {
            if (typeof req.body[key] === 'string' && !skipFields.includes(key)) {
                req.body[key] = xss(req.body[key]);
            }
        });
    }
    next();
};