import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';

// Auth configuration
const AUTH_CONFIG = {
  JWT: {
    SECRET: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
    EXPIRES_IN: '7d',
    ALGORITHM: 'HS256',
    ISSUER: 'ft-transcendence',
    AUDIENCE: 'ft-transcendence-users'
  },

  GOOGLE: {
    CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '921980179970-65l8tisfd4qls4497e846eg7mbj96lhg.apps.googleusercontent.com',
    CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || '',
    REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI || `http://localhost:${process.env.VITE_PORT || process.env.FRONTEND_PORT || '5173'}`
  },

  PASSWORD: {
    MIN_LENGTH: 8,
    REQUIRE_UPPERCASE: true,
    REQUIRE_LOWERCASE: true,
    REQUIRE_NUMBERS: true,
    REQUIRE_SPECIAL_CHARS: false,
    SALT_ROUNDS: 12
  },

  SESSION: {
    COOKIE_NAME: 'auth-token',
    COOKIE_OPTIONS: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
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

// Initialize Google OAuth client
const googleClient = new OAuth2Client(AUTH_CONFIG.GOOGLE.CLIENT_ID);

/**
 * Verify Google ID Token
 * @param {string} idToken - Google ID token from frontend
 * @returns {Promise<Object|null>} - User data or null if invalid
 */
export async function verifyGoogleToken(idToken) {
  try {
    console.log('Verifying Google token...');
    
    const ticket = await googleClient.verifyIdToken({
      idToken: idToken,
      audience: AUTH_CONFIG.GOOGLE.CLIENT_ID
    });
    
    const payload = ticket.getPayload();
    console.log('Google token verified successfully');
    
    return {
      googleId: payload['sub'],
      email: payload['email'],
      name: payload['name'],
      picture: payload['picture'],
      emailVerified: payload['email_verified']
    };
  } catch (error) {
    console.error('Google token verification failed:', error);
    return null;
  }
}

/**
 * Generate JWT Token
 * @param {Object} user - User object containing user information
 * @returns {string} - JWT token
 */
export function generateJWT(user) {
  console.log('🔑 Generating JWT for user:', user.id);
  
  const payload = {
    userId: user.id,
    email: user.email,
    name: user.name,
    iat: Math.floor(Date.now() / 1000),
    iss: AUTH_CONFIG.JWT.ISSUER,
    aud: AUTH_CONFIG.JWT.AUDIENCE
  };
  
  const token = jwt.sign(payload, AUTH_CONFIG.JWT.SECRET, {
    expiresIn: AUTH_CONFIG.JWT.EXPIRES_IN,
    algorithm: AUTH_CONFIG.JWT.ALGORITHM
  });
  
  console.log('🔑 Generated JWT (first 20 chars):', token.substring(0, 20));
  return token;
}

/**
 * Verify JWT Token
 * @param {string} token - JWT token to verify
 * @returns {Object|null} - Decoded token payload or null if invalid
 */
export function verifyJWT(token) {
  try {
    console.log('🔍 JWT Secret (first 10 chars):', AUTH_CONFIG.JWT.SECRET.substring(0, 10));
    console.log('🔍 Verifying JWT (first 20 chars):', token.substring(0, 20));
    
    const decoded = jwt.verify(token, AUTH_CONFIG.JWT.SECRET, {
      algorithms: [AUTH_CONFIG.JWT.ALGORITHM],
      issuer: AUTH_CONFIG.JWT.ISSUER,
      audience: AUTH_CONFIG.JWT.AUDIENCE
    });
    
    console.log('✅ JWT verification successful for user:', decoded.userId);
    return decoded;
  } catch (error) {
    console.error('❌ JWT verification failed:', error.message);
    return null;
  }
}

/**
 * Extract JWT from request
 * @param {Object} request - Fastify request object
 * @returns {string|null} - JWT token or null if not found
 */
export function extractTokenFromRequest(request) {
  // Try to get token from cookie first
  const cookieToken = request.cookies[AUTH_CONFIG.SESSION.COOKIE_NAME];
  if (cookieToken) {
    return cookieToken;
  }
  
  // Fallback to Authorization header
  const authHeader = request.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  return null;
}

/**
 * Middleware to authenticate requests
 * @param {Object} request - Fastify request object
 * @param {Object} reply - Fastify reply object
 * @returns {Object|null} - User data or null if unauthenticated
 */
export function authenticateRequest(request, reply) {
  const token = extractTokenFromRequest(request);
  
  if (!token) {
    reply.code(401);
    throw new Error('No authentication token provided');
  }
  
  const decoded = verifyJWT(token);
  if (!decoded) {
    reply.code(401);
    throw new Error('Invalid or expired token');
  }
  
  return decoded;
}

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {Object} - Validation result
 */
export function validatePassword(password) {
  const errors = [];
  
  if (password.length < AUTH_CONFIG.PASSWORD.MIN_LENGTH) {
    errors.push(`Password must be at least ${AUTH_CONFIG.PASSWORD.MIN_LENGTH} characters long`);
  }
  
  if (AUTH_CONFIG.PASSWORD.REQUIRE_UPPERCASE && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (AUTH_CONFIG.PASSWORD.REQUIRE_LOWERCASE && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (AUTH_CONFIG.PASSWORD.REQUIRE_NUMBERS && !/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (AUTH_CONFIG.PASSWORD.REQUIRE_SPECIAL_CHARS && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} - True if valid email format
 */
export function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export { AUTH_CONFIG }; 