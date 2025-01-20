import { Request, Response } from 'express';
import { User } from '../models/User';
import { generateToken } from '../utils/jwt.utils';
import { EmailService } from '../services/emailService';
import { AuthenticatedRequest } from '../types/custom.types';
import crypto from 'crypto';

const emailService = new EmailService();

export class AuthController {
  async register(req: Request, res: Response): Promise<void> {
    try {
      const { email, password, firstName, lastName } = req.body;

      // Check if user exists
      let user = await User.findOne({ email });
      if (user) {
        res.status(400).json({ error: 'Email already registered' });
        return;
      }

      // Create verification token
      const verificationToken = crypto.randomBytes(20).toString('hex');

      // Create user
      user = await User.create({
        email,
        password,
        firstName,
        lastName,
        verificationToken,
        isEmailVerified:false
      });

      // Send verification email
      await emailService.sendVerificationEmail(email, verificationToken);

      const token = generateToken(user);
      res.status(201).json({ token });
    } catch (error) {
      res.status(500).json({ error: 'Error registering user' });
    }
  }

  async login(req: Request, res: Response): Promise<void> {
    try {

      console.log('🔄 Login attempt received:', {
        email: req.body.email,
        ip: req.ip,
        timestamp: new Date().toISOString()
    });

      const { email, password } = req.body;
      
      const rateLimitReq = req as AuthenticatedRequest;

      if (rateLimitReq.rateLimit?.remaining === 0) {
      res.status(429).json({ 
        error: 'Too many login attempts, please try again later'
      });
      return;
     }

      // Check if user exists
      const user = await User.findOne({ email }).select('+password');
      if (!user) {
        // Increment rate limit counter for failed attempt
        rateLimitReq.rateLimit?.increment?.();
        res.status(401).json({ error: 'Invalid credentials' });
        return;
      }

      // Check password
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        // Increment rate limit counter for failed attempt
        rateLimitReq.rateLimit?.increment?.();
        res.status(401).json({ error: 'Invalid credentials' });
        return;
      }

      // Check if email is verified
      if (!user.isEmailVerified) {
        res.status(401).json({ error: 'Please verify your email' });
        return;
      }

      const token = generateToken(user);
      
      // Set rate limit headers
      if (rateLimitReq.rateLimit) {
        res.set('X-RateLimit-Remaining', String(rateLimitReq.rateLimit.remaining));
      }
      
      res.json({ token });
    } catch (error) {
      console.error('🔴 Login error:', error);
        res.status(500).json({ error: 'Error logging in' });
      // console.error('Login error:', error);
      // res.status(500).json({ error: 'Error logging in' });
    }
  }

  async verifyEmail(req: Request, res: Response): Promise<void> {
    try {
      const { token } = req.params;

      const user = await User.findOne({ verificationToken: token });
      if (!user) {
        res.status(400).json({ error: 'Invalid verification token' });
        return;
      }

      user.isEmailVerified = true;
      user.verificationToken = undefined;
      await user.save();

      const authToken = generateToken(user);
      res.json({ token: authToken });
    } catch (error) {
      res.status(500).json({ error: 'Error verifying email' });
    }
  }

  async forgotPassword(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;
  
      if (!email) {
        res.status(400).json({ error: 'Email is required' });
        return;
      }
  
      // Find user
      const user = await User.findOne({ email });
      if (!user) {
        // For security, don't reveal if user exists
        res.status(200).json({ message: 'If an account exists, a reset email will be sent' });
        return;
      }
  
      // Generate reset token
      const resetToken = crypto.randomBytes(20).toString('hex');
      const resetPasswordToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');
  
      // Save reset token to user
      user.resetPasswordToken = resetPasswordToken;
      user.resetPasswordExpire = new Date(Date.now() + 3600000); // 1 hour
      await user.save();
  
      // For testing, log the reset token
      // console.log('Password Reset Token:', resetToken);
  
      try {
        // Send reset email (we'll skip this for testing)
        await emailService.sendPasswordResetEmail(email, resetToken);
        
        res.status(200).json({ 
          message: 'Password reset email sent',
          // Include token in response only during development
          resetToken: process.env.NODE_ENV === 'development' ? resetToken : undefined
        });
      } catch (emailError) {
        console.error('Email sending failed:', emailError);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save();
        
        res.status(500).json({ error: 'Error sending reset email' });
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      res.status(500).json({ error: 'Error processing password reset' });
    }
  }

  async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const { token } = req.params;
      const { password } = req.body;
  
      if (!token || !password) {
        res.status(400).json({ error: 'Token and password are required' });
        return;
      }
  
      // Hash token to compare with stored hash
      const resetPasswordToken = crypto
        .createHash('sha256')
        .update(token)
        .digest('hex');
  
      // Find user with valid token
      const user = await User.findOne({
        resetPasswordToken,
        resetPasswordExpire: { $gt: Date.now() }
      });
  
      if (!user) {
        res.status(400).json({ error: 'Invalid or expired reset token' });
        return;
      }
  
      // Update password
      user.password = password;
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();
  
      res.status(200).json({ message: 'Password reset successful' });
    } catch (error) {
      console.error('Reset password error:', error);
      res.status(500).json({ error: 'Error resetting password' });
    }
  }

  async googleCallback(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.redirect(`${process.env.FRONTEND_URL}/login?error=no-user`);
        return;
      }

      const token = generateToken(req.user);
      res.redirect(`${process.env.FRONTEND_URL}/login?token=${token}`);
    } catch (error) {
      res.redirect(`${process.env.FRONTEND_URL}/login?error=true`);
    }
  }
}
