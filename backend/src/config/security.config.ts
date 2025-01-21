export const securityConfig = {
    jwt: {
      expiresIn: '24h',
      cookieOptions: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict' as const,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
      }
    },
    rateLimit: {
      login: {
        windowMs: 15 * 60 * 1000,
        max: 5
      },
      register: {
        windowMs: 60 * 60 * 1000,
        max: 3
      },
      passwordReset: {
        windowMs: 60 * 60 * 1000,
        max: 3
      }
    }
  };