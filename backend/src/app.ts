import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import passport from 'passport';
import { connectDatabase } from './config/database';
import userRoutes from './routes/userRoutes';
import authRoutes from './routes/authRoutes';
import { sanitizeMongoQuery, sanitizeInput } from './middlewares/sanitize.middleware';
import helmet from 'helmet';

dotenv.config();

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing middleware
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Sanitization middleware
app.use(sanitizeMongoQuery);
app.use(sanitizeInput);

// Passport initialization
app.use(passport.initialize());

// Logging middleware
app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/auth', authRoutes);  // Only once!
app.use('/api/users', userRoutes); // Only once!

// Health check route
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', database: 'connected' });
});

app.get('/api/health', (_req: Request, res: Response) => {
  res.status(200).json({ 
    status: 'ok',
    database: 'connected',
    securityHeaders: {
      'Content-Security-Policy': res.getHeader('Content-Security-Policy'),
      'X-Frame-Options': res.getHeader('X-Frame-Options'),
      'X-XSS-Protection': res.getHeader('X-XSS-Protection'),
      'X-Content-Type-Options': res.getHeader('X-Content-Type-Options')
    }
  });
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(`[Error] ${req.method} ${req.path}:`, err);
  
  if (res.headersSent) {
    return next(err);
  }

  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler - must be after all other routes
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Route not found' });
});

// Connect to MongoDB and start server
const startServer = async () => {
  try {
    await connectDatabase();
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Health check available at http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;