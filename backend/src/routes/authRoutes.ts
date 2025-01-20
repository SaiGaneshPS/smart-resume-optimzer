import express from 'express';
import { AuthController } from '../controllers/authController';
import { authenticateGoogle, authenticateGoogleCallback } from '../middlewares/auth.middleware';
import { loginLimiter, registerLimiter, passwordResetLimiter } from '../middlewares/rateLimiter.middleware';

const router = express.Router();
const authController = new AuthController();

// Local authentication routes
router.post('/register', registerLimiter, (req, res) => {
  authController.register(req, res);
});

router.post('/login', loginLimiter, (req, res) => {
  authController.login(req, res);
});

router.post('/forgot-password', passwordResetLimiter, (req, res) => {
  authController.forgotPassword(req, res);
});

router.get('/verify-email/:token', (req, res) => authController.verifyEmail(req, res));
router.post('/reset-password/:token', (req, res) => authController.resetPassword(req, res));

// Google authentication routes
router.get('/google', authenticateGoogle);
router.get('/google/callback', authenticateGoogleCallback, (req, res) => 
  authController.googleCallback(req, res)
);

export default router;
