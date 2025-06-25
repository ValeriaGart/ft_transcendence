import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { AUTH_CONFIG } from '../../../config/auth.ts';

// Initialize Google OAuth client
const googleClient = new OAuth2Client(AUTH_CONFIG.GOOGLE_CLIENT_ID);

/**
 * Generate JWT token for authenticated user
 * @param {Object} user - User object with id and email
 * @returns {string} JWT token
 */
export function generateJWT(user) {
  const payload = {
    userId: user.id,
    email: user.email
  };
  
  return jwt.sign(payload, AUTH_CONFIG.JWT_SECRET, {
    expiresIn: AUTH_CONFIG.JWT_EXPIRES_IN
  });
}

/**
 * Verify and decode JWT token
 * @param {string} token - JWT token to verify
 * @returns {Object|null} Decoded payload or null if invalid
 */
export function verifyJWT(token) {
  try {
    const decoded = jwt.verify(token, AUTH_CONFIG.JWT_SECRET);
    return decoded;
  } catch (error) {
    console.error('JWT verification failed:', error);
    return null;
  }
}

/**
 * Verify Google ID token and extract user information
 * @param {string} idToken - Google ID token
 * @returns {Promise<Object|null>} User information or null if invalid
 */
export async function verifyGoogleToken(idToken) {
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: AUTH_CONFIG.GOOGLE_CLIENT_ID
    });
    
    const payload = ticket.getPayload();
    if (!payload) {
      return null;
    }
    
    return {
      id: 0, // Will be set after database operations
      email: payload.email,
      googleId: payload.sub,
      profilePictureUrl: payload.picture,
      name: payload.name
    };
  } catch (error) {
    console.error('Google token verification failed:', error);
    return null;
  }
}

/**
 * Extract token from Authorization header
 * @param {string|undefined} authHeader - Authorization header value
 * @returns {string|null} Extracted token or null
 */
export function extractTokenFromHeader(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}

/**
 * Create authentication middleware for Fastify
 * @returns {Function} Middleware function
 */
export function createAuthMiddleware() {
  return async function(request, reply) {
    const authHeader = request.headers.authorization;
    const token = extractTokenFromHeader(authHeader);
    
    if (!token) {
      reply.code(401);
      throw new Error('Authentication token required');
    }
    
    const payload = verifyJWT(token);
    if (!payload) {
      reply.code(401);
      throw new Error('Invalid or expired token');
    }
    
    request.user = payload;
  };
}

export { AUTH_CONFIG };
