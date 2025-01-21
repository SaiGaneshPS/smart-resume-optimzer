import { Request, Response, NextFunction } from 'express';
import passport from 'passport';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { Strategy as GoogleStrategy, Profile } from 'passport-google-oauth20';
import { User, IUserDocument } from '../models/User';

// Extend Express User type
declare global {
  namespace Express {
    interface User extends IUserDocument {}
  }
}

// Define JWT payload type
interface JwtPayload {
    id: string;
    email: string;
  }
  
  interface AuthError extends Error {
    status?: number;
    code?: string;
  }
  
  type DoneCallback = (
    error: AuthError | null, 
    user?: IUserDocument | false, 
    info?: { message: string }
  ) => void;

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET is not defined');
}

// JWT Strategy
const jwtStrategy = new JwtStrategy(
    {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET,
    },
    async (payload: JwtPayload, done: DoneCallback) => {
      try {
        const user = await User.findById(payload.id);
        if (!user) {
          return done(null, false, { message: 'User not found' });
        }
        return done(null, user);
      } catch (error) {
        return done(error as AuthError);
      }
    }
  );

if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || !process.env.GOOGLE_CALLBACK_URL) {
  throw new Error('Google OAuth credentials are not defined');
}

// Google Strategy
const googleStrategy = new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: process.env.GOOGLE_CALLBACK_URL!,
      passReqToCallback: true
    },
    async (_req: Request, _accessToken: string, _refreshToken: string, profile: Profile, done: any) => {
      try {
        let user = await User.findOne({ googleId: profile.id });
  
        if (!user) {
          // Extract email from profile
          const email = profile.emails?.[0]?.value;
          if (!email) {
            return done(new Error('No email provided from Google'));
          }
  
          // Check if user exists with this email
          user = await User.findOne({ email });
  
          if (user) {
            // Update existing user with Google ID
            user.googleId = profile.id;
            user.isEmailVerified = true;
            if (profile.photos?.[0]?.value) {
              user.profilePicture = profile.photos[0].value;
            }
            await user.save();
          } else {
            // Create new user
            user = await User.create({
              googleId: profile.id,
              email,
              firstName: profile.name?.givenName || 'Unknown',
              lastName: profile.name?.familyName || 'Unknown', // Provide default value
              isEmailVerified: true,
              profilePicture: profile.photos?.[0]?.value
            });
          }
        }
  
        return done(null, user);
      } catch (error) {
        console.error('Google auth error:', error);
        return done(error);
      }
    }
  );

// Initialize passport
passport.use(jwtStrategy);
passport.use(googleStrategy);

// Authenticated Request interface
export interface AuthenticatedRequest extends Request {
  user?: IUserDocument;
}

// Export middleware functions
export const authenticate = passport.authenticate('jwt', { session: false });
export const authenticateGoogle = passport.authenticate('google', {
  scope: ['profile', 'email']
});
export const authenticateGoogleCallback = passport.authenticate('google', {
  session: false,
  failureRedirect: '/login'
});

// Helper function to ensure user is authenticated
export const ensureAuthenticated = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ 
          error: 'Unauthorized',
          message: 'Authentication required'
        });
        return;
      }
      next();
    } catch (error) {
      res.status(500).json({ 
        error: 'Authentication error',
        message: (error as Error).message 
      });
    }
  };