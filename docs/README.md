# Authentication API Documentation

## Environment Variables Required

- JWT_SECRET
- MONGODB_URI
- GOOGLE_CLIENT_ID
- GOOGLE_CLIENT_SECRET
- GOOGLE_CALLBACK_URL
- FRONTEND_URL

## Authentication Endpoints

- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/forgot-password
- POST /api/auth/reset-password/:token
- GET /api/auth/google
- GET /api/auth/google/callback

## Setup Instructions

1. Copy .env.example to .env
2. Fill in required environment variables
3. Run `npm install`
4. Start server with `npm run dev`
