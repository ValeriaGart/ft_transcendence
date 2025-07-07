import AuthService from '../services/auth.service.js';
import { 
  verifyGoogleToken, 
  generateJWT, 
  validatePassword, 
  validateEmail,
  AUTH_CONFIG 
} from '../plugins/auth-utils.js';

class AuthController {
  static async googleAuth(request, reply) {
    try {
      const { credential } = request.body;
      
      if (!credential) {
        reply.code(400);
        return { error: 'Google credential is required' };
      }

      const googleUser = await verifyGoogleToken(credential);
      if (!googleUser) {
        reply.code(401);
        return { error: 'Invalid Google token' };
      }

      let user = await AuthService.findUserByEmail(googleUser.email);
      
      if (!user) {
        // Create new user from Google data
        user = await AuthService.createGoogleUser({
          email: googleUser.email,
          name: googleUser.name,
          googleId: googleUser.googleId,
          profilePicture: googleUser.picture,
          emailVerified: googleUser.emailVerified
        });
      } else {
        // Update existing user with Google ID if not set
        if (!user.googleId) {
          await AuthService.updateUserGoogleId(user.id, googleUser.googleId);
          user.googleId = googleUser.googleId;
        }
        
        await AuthService.updateLastLogin(user.id);
      }

      const token = generateJWT(user);

      reply.setCookie(AUTH_CONFIG.SESSION.COOKIE_NAME, token, AUTH_CONFIG.SESSION.COOKIE_OPTIONS);

      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
        },
        token
      };

    } catch (error) { 
      reply.code(500);
      return { error: 'Authentication failed', details: error.message };
    }
  }

  static async register(request, reply) {
    try {
      const { email, password, name } = request.body;

      if (!validateEmail(email)) {
        reply.code(400);
        return { error: 'Invalid email format' };
      }

      const passwordValidation = validatePassword(password);
      if (!passwordValidation.valid) {
        reply.code(400);
        return { error: 'Password validation failed', details: passwordValidation.errors };
      }

      const existingUser = await AuthService.findUserByEmail(email);
      if (existingUser) {
        reply.code(409);
        return { error: 'User with this email already exists' };
      }

      const user = await AuthService.createPasswordUser({
        email,
        password,
        name: name || email.split('@')[0] // Use email prefix as default name
      });

      const token = generateJWT(user);

      reply.setCookie(AUTH_CONFIG.SESSION.COOKIE_NAME, token, AUTH_CONFIG.SESSION.COOKIE_OPTIONS);

      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
        },
        token
      };

    } catch (error) {
      reply.code(500);
      return { error: 'Registration failed', details: error.message };
    }
  }

  static async login(request, reply) {
    try {
      const { email, password } = request.body;

      if (!validateEmail(email)) {
        reply.code(400);
        return { error: 'Invalid email format' };
      }

      const user = await AuthService.findUserByEmail(email);
      if (!user) {
        reply.code(401);
        return { error: 'Invalid email or password' };
      }

      if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
        reply.code(423);
        return { 
          error: 'Account temporarily locked due to too many failed login attempts',
          lockedUntil: user.lockedUntil
        };
      }

      if (!user.passwordHash) {
        reply.code(400);
        return { error: 'This account uses Google Sign-in. Please use Google to login.' };
      }

      const isValidPassword = await AuthService.verifyPassword(password, user.passwordHash);
      if (!isValidPassword) {
        await AuthService.incrementFailedLoginAttempts(user.id);
        
        reply.code(401);
        return { error: 'Invalid email or password' };
      }

      await AuthService.resetFailedLoginAttempts(user.id);
      await AuthService.updateLastLogin(user.id);

      const token = generateJWT(user);

      reply.setCookie(AUTH_CONFIG.SESSION.COOKIE_NAME, token, AUTH_CONFIG.SESSION.COOKIE_OPTIONS);

      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
        },
        token
      };

    } catch (error) {
      reply.code(500);
      return { error: 'Login failed', details: error.message };
    }
  }

  static async logout(request, reply) {
    try {
      reply.clearCookie(AUTH_CONFIG.SESSION.COOKIE_NAME, {
        path: '/',
        httpOnly: true,
        secure: AUTH_CONFIG.SESSION.COOKIE_OPTIONS.secure,
        sameSite: AUTH_CONFIG.SESSION.COOKIE_OPTIONS.sameSite
      });

      return { success: true, message: 'Logged out successfully' };

    } catch (error) {
      reply.code(500);
      return { error: 'Logout failed', details: error.message };
    }
  }

  static async refresh(request, reply) {
    try {
      const userId = request.user.userId;
      
      // Get fresh user data
      const user = await AuthService.findUserById(userId);
      if (!user || !user.isActive) {
        reply.code(401);
        return { error: 'User not found or inactive' };
      }

      const token = generateJWT(user);

      reply.setCookie(AUTH_CONFIG.SESSION.COOKIE_NAME, token, AUTH_CONFIG.SESSION.COOKIE_OPTIONS);

      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
        },
        token
      };

    } catch (error) {
      reply.code(500);
      return { error: 'Token refresh failed', details: error.message };
    }
  }

  static async getCurrentUser(request, reply) {
    try {
      const userId = request.user.userId;
      
      const user = await AuthService.findUserById(userId);
      if (!user) {
        reply.code(404);
        return { error: 'User not found' };
      }

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
      reply.code(500);
      return { error: 'Failed to get user information', details: error.message };
    }
  }
}

export default AuthController;
