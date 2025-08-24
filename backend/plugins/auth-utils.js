import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { log, DEBUG, INFO, WARN, ERROR } from '../utils/logger.utils.js';
import { getAuthConfig } from '../config/auth.config.js';

// Create OAuth2Client dynamically to use current environment variables
function getGoogleClient() {
  const config = getAuthConfig();
  return new OAuth2Client(config.GOOGLE.CLIENT_ID);
}


export async function verifyGoogleToken(idToken) {
  try {
    const config = getAuthConfig();
    
    const googleClient = getGoogleClient();
    const ticket = await googleClient.verifyIdToken({
      idToken: idToken,
      audience: config.GOOGLE.CLIENT_ID
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

export function generateJWT(user, sessionId) {
  const config = getAuthConfig();
  const payload = {
    userId: user.id,
    email: user.email,
    name: user.name,
    sessionId,
    iat: Math.floor(Date.now() / 1000),
    iss: config.JWT.ISSUER,
    aud: config.JWT.AUDIENCE
  };
  
  const token = jwt.sign(payload, config.JWT.SECRET, {
    expiresIn: config.JWT.EXPIRES_IN,
    algorithm: config.JWT.ALGORITHM
  });
  
  return token;
}

export function verifyJWT(token) {
  try {
    const config = getAuthConfig();
    const decoded = jwt.verify(token, config.JWT.SECRET, {
      algorithms: [config.JWT.ALGORITHM],
      issuer: config.JWT.ISSUER,
      audience: config.JWT.AUDIENCE
    });
    
    return decoded;
  } catch (error) {
    return null;
  }
}

export function extractTokenFromRequest(request) {
  // Try to get token from cookie first
  const config = getAuthConfig();
  const cookieToken = request.cookies[config.SESSION.COOKIE_NAME];
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
  const config = getAuthConfig();
  const errors = [];
  
  if (password.length < config.PASSWORD.MIN_LENGTH) {
    errors.push(`Password must be at least ${config.PASSWORD.MIN_LENGTH} characters long`);
  }
  
  if (password.length > config.PASSWORD.MAX_LENGTH) {
    errors.push(`Password must be no more than ${config.PASSWORD.MAX_LENGTH} characters long`);
  }
  
  if (password.includes(' ')) {
    errors.push('Password must not contain spaces');
  }
  
  if (config.PASSWORD.REQUIRE_UPPERCASE && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (config.PASSWORD.REQUIRE_LOWERCASE && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (config.PASSWORD.REQUIRE_NUMBERS && !/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (config.PASSWORD.REQUIRE_SPECIAL && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
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
