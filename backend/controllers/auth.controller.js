import AuthService from '../services/auth.service.js';
import SessionService from '../services/session.service.js';
import { 
  verifyGoogleToken, 
  generateJWT, 
  validatePassword, 
  validateEmail
} from '../plugins/auth-utils.js';
import { getAuthConfig } from '../config/auth.config.js';

import { INFO, WARN, DEBUG, ERROR, log } from '../utils/logger.utils.js';

class AuthController {
  static async googleSignup(request, reply) {
    try {
      const { credential } = request.body;
      
      if (!credential) {
        log("Google Signup failed: Google credential is missing.", WARN);
        reply.code(400);
        return { error: 'Google credential is required' };
      }

      const googleUser = await verifyGoogleToken(credential);
      if (!googleUser) {
        log("Google Signup failed: Invalid Google token.", WARN);
        reply.code(401);
        return { error: 'Invalid Google token' };
      }

      // Check if user already exists - if so, reject signup
      const existingUser = await AuthService.findUserByEmail(googleUser.email);
      if (existingUser) {
        log("Google Signup failed: User with this email already exists.", WARN);
        reply.code(409);
        return { error: 'User with this email already exists. Please use Sign In instead.' };
      }

      // Create new user from Google data
      const user = await AuthService.createGoogleUser({
        email: googleUser.email,
        name: googleUser.name,
        googleId: googleUser.googleId,
        profilePicture: googleUser.picture,
        emailVerified: googleUser.emailVerified
      });

      log("Google Signup successful.", INFO);
      return {
        success: true,
        message: 'Google signup successful! Please sign in to continue.',
        user: {
          id: user.id,
          email: user.email,
        }
      };

    } catch (error) { 
      reply.code(500);
      log("Google Signup failed.", WARN);
      return { error: 'Google signup failed', details: error.message };
    }
  }

  static async googleSignin(request, reply) {
    try {
      const { credential } = request.body;
      if (!credential) { 
        log("Google Sign-in failed: Google credential is missing.", WARN);
        reply.code(400); 
        return { error: 'Google credential is required' }; 
      }
      const googleUser = await verifyGoogleToken(credential);
      if (!googleUser) { 
        log("Google Sign-in failed: Invalid Google token.", WARN);
        reply.code(401); 
        return { error: 'Invalid Google token' }; 
      }
      const user = await AuthService.findUserByEmail(googleUser.email);
      if (!user) { 
        log("Google Sign-in failed: User with this email doesn't exist.", WARN);
        reply.code(404); 
        return { error: 'No account found with this email. Please sign up first.' }; 
      }
      if (!user.googleId) { 
        log("Google Sign-in failed: This account uses email/password authentication.", WARN);
        reply.code(400); 
        return { error: 'This account uses email/password authentication. Please use regular Sign In.' }; 
      }
      // Single-session enforcement
      const existing = await SessionService.getActiveSession(user.id);
      if (existing) { 
        log("Google Sign-in failed: Already logged in somewhere else.", WARN);
        reply.code(409); 
        return { error: 'Already logged in somewhere else' }; 
      }
      await AuthService.updateLastLogin(user.id);
      const { sessionId } = await SessionService.startSession(user.id);
      const token = generateJWT(user, sessionId);
      const config = getAuthConfig();
      reply.setCookie(config.SESSION.COOKIE_NAME, token, config.SESSION.COOKIE_OPTIONS);
      log("Google Sign-in is successful", INFO);
      return { 
          success: true, 
          user: { 
            id: user.id, 
            email: user.email 
          }, 
        token 
      };
    } catch (error) { 
      log("Google Sign-in failed", WARN);
      reply.code(500); 
      return { error: 'Google signin failed', details: error.message }; 
    }
  }



  static async register(request, reply) {
    try {
      const { email, password, name } = request.body;

      // XSS middleware already sanitized the input
      if (!validateEmail(email)) {
        log("Registration failed: Invalid email format", WARN);
        reply.code(400);
        return { error: 'Invalid email format' };
      }

      const passwordValidation = validatePassword(password);
      if (!passwordValidation.valid) {
        log("Registration failed: Password validation failed", WARN);
        log(passwordValidation.errors, DEBUG)
        reply.code(400);
        return { error: 'Password validation failed', details: passwordValidation.errors };
      }

      const existingUser = await AuthService.findUserByEmail(email);
      if (existingUser) {
        log("Registration failed: User with this email already exists", WARN);
        reply.code(409);
        return { error: 'User with this email already exists' };
      }

      const user = await AuthService.createPasswordUser({
        email,
        password,
        name: name || email.split('@')[0] // Use email prefix as default name
      });
      log("Registration successful", IFNO);
      return {
        success: true,
        message: 'Registration successful! Please sign in to continue.',
        user: {
          id: user.id,
          email: user.email,
        }
      };

    } catch (error) {
      log("Registration failed", WARN);
      log(error, WARN);
      reply.code(500);
      return { error: 'Registration failed', details: error.message };
    }
  }

  static async login(request, reply) {
    try {
      const { email, password } = request.body;

      // XSS middleware already sanitized the input
      if (!validateEmail(email)) {
        log("Login failed: Invalid email format", WARN);
        reply.code(400);
        return { error: 'Invalid email format' };
      }

      const user = await AuthService.findUserByEmail(email);
      if (!user) {
        log("Login failed: Invalid email or password", WARN);
        reply.code(401);
        return { error: 'Invalid email or password' };
      }

      if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
        log("Login failed: Account temporarily locked due to too many failed login attempts", WARN);
        reply.code(423);
        return { 
          error: 'Account temporarily locked due to too many failed login attempts',
          lockedUntil: user.lockedUntil
        };
      }

      if (!user.passwordHash) {
        log("Login failed: This account uses Google Sign-in. Please use Google to login.", WARN);
        reply.code(400);
        return { error: 'This account uses Google Sign-in. Please use Google to login.' };
      }

      const isValidPassword = await AuthService.verifyPassword(password, user.passwordHash);
      if (!isValidPassword) {
        await AuthService.incrementFailedLoginAttempts(user.id);
        
        log("Login failed: Invalid email or password", WARN);
        reply.code(401);
        return { error: 'Invalid email or password' };
      }

      await AuthService.resetFailedLoginAttempts(user.id);
      const existing = await SessionService.getActiveSession(user.id);
      if (existing) { 
        log("Login failed: Already logged in somewhere else", WARN);
        reply.code(409); 
        return { error: 'Already logged in somewhere else' }; 
      }
      await AuthService.updateLastLogin(user.id);
      const { sessionId } = await SessionService.startSession(user.id);
      const token = generateJWT(user, sessionId);
      const config = getAuthConfig();
      reply.setCookie(config.SESSION.COOKIE_NAME, token, config.SESSION.COOKIE_OPTIONS);
      log("Login successful", INFO);
      return { 
        success: true, 
        user: { 
          id: user.id, 
          email: user.email 
        }, 
          token 
      };
    } catch (error) { 
      // Enhanced logging to diagnose 500s
      log('ERROR: [AuthController.login] Unexpected error: ' + error, ERROR);
      reply.code(500); 
      return { error: 'Login failed', details: error.message };
    }
  }

  static async logout(request, reply) {
    try {
      const config = getAuthConfig();
      reply.clearCookie(config.SESSION.COOKIE_NAME, { 
        path: '/', 
        httpOnly: true, 
        secure: config.SESSION.COOKIE_OPTIONS.secure, 
        sameSite: config.SESSION.COOKIE_OPTIONS.sameSite 
      });
      log("Logout successful", INFO);
      return { success: true, message: 'Logged out successfully' };
    } catch (error) { 
      log("Logout failed", WARN);
      log(error, WARN);
      reply.code(500); 
      return { error: 'Logout failed', details: error.message }; }
  }

  static async refresh(request, reply) {
    try {
      const userId = request.user.userId;
      const user = await AuthService.findUserById(userId);
      if (!user || !user.isActive) { 
        log("Refresh failed: User not found or inactive", WARN);
        reply.code(401); 
        return { error: 'User not found or inactive' }; 
      }
      const valid = await SessionService.validateSession(userId, request.user.sessionId);
      if (!valid) { 
        log("Refresh failed: Session invalid", WARN);
        reply.code(401); 
        return { error: 'SESSION_INVALID' }; 
      }
      const token = generateJWT(user, request.user.sessionId);
      const config = getAuthConfig();
      reply.setCookie(config.SESSION.COOKIE_NAME, token, config.SESSION.COOKIE_OPTIONS);
      log("Refresh successful", INFO);
      return { 
        success: true, 
        user: { 
          id: user.id, 
          email: user.email }, 
          token 
      };
    } catch (error) { 
      log("Refresh failed: Token refresh failed", WARN);
      log(error, WARN);
      reply.code(500); 
      return { error: 'Token refresh failed', details: error.message }; 
    }
  }

  static async getCurrentUser(request, reply) {
    try {
      const userId = request.user.userId;
      const user = await AuthService.findUserById(userId);
      if (!user) { 
        log("getCurrentUser failed: User not found", WARN);
        reply.code(404); 
        return { error: 'User not found' }; 
      }
      const ok = await SessionService.validateSession(userId, request.user.sessionId);
      if (!ok) { 
        log("getCurrentUser failed: Session invalid", WARN);
        reply.code(401); 
        return { error: 'SESSION_INVALID' }; 
      }
      log("getCurrentUser successful", INFO);
      return { 
        success: true, 
        user: { 
          id: user.id, 
          email: user.email, 
          emailVerified: user.emailVerified, 
          lastLoginAt: user.lastLoginAt, 
          createdAt: user.createdAt 
        } 
      };
    } catch (error) { 
      log("getCurrentUser failed: Failed to get user information", WARN);
      log(error, DEBUG);
      reply.code(500); 
      return { error: 'Failed to get user information', details: error.message }; 
    }
  }
}

export default AuthController;
