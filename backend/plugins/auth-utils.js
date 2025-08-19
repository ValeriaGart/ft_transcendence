import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { AUTH_CONFIG } from '../config/auth.config.js';
import { log, DEBUG, INFO, WARN, ERROR } from '../utils/logger.utils.js';

const googleClient = new OAuth2Client(AUTH_CONFIG.GOOGLE.CLIENT_ID);


export async function verifyGoogleToken(idToken) {
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: idToken,
      audience: AUTH_CONFIG.GOOGLE.CLIENT_ID
    });
    
    const payload = ticket.getPayload();
    
    return {
      googleId: payload['sub'],
      email: payload['email'],
      name: payload['name'],
      picture: payload['picture'],
      emailVerified: payload['email_verified']
    };
  } catch (error) {
    log('Google token verification failed: ' + error, WARN);
    return null;
  }
}

export function generateJWT(user) {
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
  
  return token;
}

export function verifyJWT(token) {
  try {
    const decoded = jwt.verify(token, AUTH_CONFIG.JWT.SECRET, {
      algorithms: [AUTH_CONFIG.JWT.ALGORITHM],
      issuer: AUTH_CONFIG.JWT.ISSUER,
      audience: AUTH_CONFIG.JWT.AUDIENCE
    });
    
    return decoded;
  } catch (error) {
    return null;
  }
}

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

export function validatePassword(password) {
  const errors = [];
  
  if (password.length < AUTH_CONFIG.PASSWORD.MIN_LENGTH) {
    errors.push(`Password must be at least ${AUTH_CONFIG.PASSWORD.MIN_LENGTH} characters long`);
  }
  
  if (password.length > AUTH_CONFIG.PASSWORD.MAX_LENGTH) {
    errors.push(`Password must be no more than ${AUTH_CONFIG.PASSWORD.MAX_LENGTH} characters long`);
  }
  
  if (password.includes(' ')) {
    errors.push('Password must not contain spaces');
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
  
  return {
    valid: errors.length === 0,
    errors
  };
}

export function validateEmail(email) {
  // More comprehensive email validation
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  
  if (!email || typeof email !== 'string') {
    return false;
  }
  
  if (email.length > 254) {
    return false;
  }
  
  const localPart = email.split('@')[0];
  if (localPart.length > 64) {
    return false;
  }
  
  const parts = email.split('@');
  if (parts.length !== 2) {
    return false;
  }
  const domainPart = parts[1];
  if (domainPart.length > 253) {
    return false;
  }
  
  // Regex validation
  return emailRegex.test(email);
}

export { AUTH_CONFIG };
