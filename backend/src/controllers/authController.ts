import { Request, Response } from 'express';
import { User, IUserDocument } from '../models/User';
import { generateToken } from '../utils/jwt.utils';
import { EmailService } from '../services/emailService';
import { AuthenticatedRequest } from '../types/custom.types';
import crypto from 'crypto';

const emailService = new EmailService();

export class AuthController {
  async register(req: Request, res: Response): Promise<void> {
    try {
        console.log('Registration attempt with data:', {
            email: req.body.email,
            firstName: req.body.firstName,
            lastName: req.body.lastName
        });

        const { email, password, firstName, lastName } = req.body;

        // Check if user exists
        let user = await User.findOne({ email });
        if (user) {
            console.log('Registration failed: Email already exists:', email);
            res.status(400).json({ error: 'Email already registered' });
            return;
        }

        try {
            // Create user
            user = await User.create({
                email,
                password,
                firstName,
                lastName,
                verificationToken: crypto.randomBytes(20).toString('hex'),
                isEmailVerified: true
            });

            console.log('User created:', {
                id: user._id,
                email: user.email,
                hasPassword: !!user.password // Check if password was saved
            });

            const token = generateToken(user);
            console.log('Token generated successfully');

            try {
                await emailService.sendVerificationEmail(email, user.verificationToken!);
                console.log('Verification email sent');
            } catch (emailError) {
                console.error('Email sending failed:', emailError);
                // Continue since user is created
            }

            res.status(201).json({ 
                message: 'Registration successful',
                token 
            });

        } catch (createError) {
            console.error('Error creating user:', createError);
            throw createError; // Let outer catch handle it
        }

    } catch (error) {
        console.error('Full registration error:', error);
        res.status(500).json({ error: 'Error registering user' });
    }
}

async login(req: Request, res: Response): Promise<void> {
    try {
        console.log('Login attempt:', {
            email: req.body.email,
            hasPassword: !!req.body.password
        });

        const { email, password } = req.body;

        // Check if user exists
        const user = await User.findOne({ email }).select('+password');
        console.log('User found:', {
            exists: !!user,
            hasPassword: user ? !!user.password : false,
            isEmailVerified: user ? user.isEmailVerified : false
        });

        if (!user) {
            console.log('Login failed: User not found');
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        console.log('Password check:', {
            isMatch,
            providedPassword: !!password
        });

        if (!isMatch) {
            console.log('Login failed: Password mismatch');
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }

        // Check if email is verified
        if (!user.isEmailVerified) {
            console.log('Login failed: Email not verified');
            res.status(401).json({ error: 'Please verify your email' });
            return;
        }

        const token = generateToken(user);
        console.log('Login successful, token generated');

        res.json({ token });

    } catch (error) {
        console.error('Full login error:', error);
        res.status(500).json({ error: 'Error logging in' });
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
  async updateProfile(req: Request, res: Response): Promise<void> {
    try {
        const userId = (req.user as IUserDocument)?._id;
        const { firstName, lastName, currentPassword, newPassword } = req.body;

        const user = await User.findById(userId).select('+password');
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        // Update name fields
        user.firstName = firstName;
        user.lastName = lastName;

        // Handle password update if provided
        if (currentPassword && newPassword) {
            const isPasswordValid = await user.comparePassword(currentPassword);
            if (!isPasswordValid) {
                res.status(401).json({ error: 'Current password is incorrect' });
                return;
            }
            user.password = newPassword; // The pre-save hook will hash it
        }

        await user.save();

        res.json({
            message: 'Profile updated successfully',
            user: {
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email
            }
        });
    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({ error: 'Error updating profile' });
    }
}
}