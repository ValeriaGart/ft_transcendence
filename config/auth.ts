/**
 * Authentication Configuration
 * Contains settings for Google OAuth and JWT tokens
 */

export const AUTH_CONFIG = {
  // Google OAuth Configuration
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || 'your-google-client-id.apps.googleusercontent.com',
  
  // JWT Configuration
  JWT_SECRET: process.env.JWT_SECRET || 'your-super-secure-jwt-secret-key',
  JWT_EXPIRES_IN: '7d',
  
  // Redirect URLs
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
  BACKEND_URL: process.env.BACKEND_URL || 'http://localhost:3000',
  
  // Authentication endpoints
  ENDPOINTS: {
    GOOGLE_AUTH: '/auth/google',
    GOOGLE_CALLBACK: '/auth/google/callback',
    VERIFY_TOKEN: '/auth/verify',
    LOGOUT: '/auth/logout'
  }
};

// Cookie settings
export const COOKIE_CONFIG = {
  name: 'auth_token',
  secure: process.env.NODE_ENV === 'production',
  httpOnly: true,
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};
