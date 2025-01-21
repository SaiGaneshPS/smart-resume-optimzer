import express, { Request, Response } from 'express';
import { AuthController } from '../controllers/authController';
import { 
    authenticate, 
    authenticateGoogle, 
    authenticateGoogleCallback,
    AuthenticatedRequest 
} from '../middlewares/auth.middleware';
import { loginLimiter, registerLimiter, passwordResetLimiter } from '../middlewares/rateLimiter.middleware';
import { validateRequest } from '../middlewares/validate.middleware';
import { updateProfileSchema } from '../validators/profile.validator';

const router = express.Router();
const authController = new AuthController();

// Existing routes
router.post('/register', registerLimiter, (req: Request, res: Response) => {
    authController.register(req, res);
});

router.post('/login', loginLimiter, (req: Request, res: Response) => {
    authController.login(req, res);
});

router.post('/forgot-password', passwordResetLimiter, (req: Request, res: Response) => {
    authController.forgotPassword(req, res);
});

router.get('/verify-email/:token', (req: Request, res: Response) => 
    authController.verifyEmail(req, res)
);

router.post('/reset-password/:token', (req: Request, res: Response) => 
    authController.resetPassword(req, res)
);

// New profile update route
router.put(
    '/profile',
    authenticate,
    validateRequest(updateProfileSchema),
    (req: AuthenticatedRequest, res: Response) => {
        authController.updateProfile(req, res);
    }
);

// Google authentication routes
router.get('/google', authenticateGoogle);
router.get('/google/callback', 
    authenticateGoogleCallback, 
    (req: Request, res: Response) => authController.googleCallback(req, res)
);

export default router;