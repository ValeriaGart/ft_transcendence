
// Dynamic function to get auth config with current environment variables
export function getAuthConfig() {
  return {
    JWT: {
      SECRET: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
      EXPIRES_IN: '1h',
      ALGORITHM: 'HS256',
      ISSUER: 'ft-transcendence',
      AUDIENCE: 'ft-transcendence-users'
    },

    GOOGLE: {
      CLIENT_ID: process.env.VITE_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID || '921980179970-65l8tisfd4qls4497e846eg7mbj96lhg.apps.googleusercontent.com',
      CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || ''
    },

    PASSWORD: {
      MIN_LENGTH: 6,
      REQUIRE_UPPERCASE: true,
      REQUIRE_LOWERCASE: true,
      REQUIRE_NUMBERS: true,
      REQUIRE_SPECIAL: false,
      SALT_ROUNDS: 12
    },

    SESSION: {
      COOKIE_NAME: 'auth-token',
      COOKIE_OPTIONS: {
        httpOnly: true,
        secure: process.env.SSL_ENABLED === 'true',
        sameSite: 'lax',
        maxAge: 60 * 60 * 1000, // 1 hour
        path: '/' // Accessible across the entire domain
      }
    },

  SECURITY: {
    MAX_LOGIN_ATTEMPTS: 5,
    LOCKOUT_DURATION: 15 * 60 * 1000, // 15 minutes
    RATE_LIMIT: {
      MAX_REQUESTS: 100,
      WINDOW_MS: 15 * 60 * 1000 // 15 minutes
    }
  }
  };
}

// For backward compatibility, export AUTH_CONFIG as a getter function
export const AUTH_CONFIG = getAuthConfig();
