import UserService from '../services/user.service.js';

class UserController {
  static async getAllUsers(request, reply) {
    try {
      const users = await UserService.getAllUsers();
      return users;
    } catch (error) {
      reply.code(500);
      return { error: 'Failed to retrieve users', details: error.message };
    }
  }

  static async getUserById(request, reply) {
    try {
      const { id } = request.params;
      const user = await UserService.getUserById(id);
      
      if (!user) {
        reply.code(404);
        return { error: 'User not found' };
      }
      
      return user;
    } catch (error) {
      reply.code(500);
      return { error: 'Failed to retrieve user', details: error.message };
    }
  }

  static async getCurrentUser(request, reply) {
    try {
      const userId = request.user.userId;
      const user = await UserService.getUserById(userId);
      
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
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        }
      };
    } catch (error) {
      reply.code(500);
      return { error: 'Failed to get user', details: error.message };
    }
  }

  static async getCurrentUserAuthType(request, reply) {
    try {
      const userId = request.user.userId;
      const user = await UserService.getUserWithAuthInfo(userId);
      
      if (!user) {
        reply.code(404);
        return { error: 'User not found' };
      }
      
      const hasPassword = !!user.passwordHash;
      const hasGoogleId = !!user.googleId;
      
      return {
        success: true,
        authType: {
          hasPassword,
          hasGoogleId,
          isGoogleUser: hasGoogleId && !hasPassword,
          isPasswordUser: hasPassword && !hasGoogleId,
          isHybridUser: hasPassword && hasGoogleId
        }
      };
    } catch (error) {
      reply.code(500);
      return { error: 'Failed to get auth type', details: error.message };
    }
  }

  static async verifyCurrentUserPassword(request, reply) {
    try {
      const userId = request.user.userId;
      const { password } = request.body;
      
      if (!password) {
        reply.code(400);
        return { error: 'Password is required' };
      }
      
      const isValid = await UserService.verifyUserPassword(userId, password);
      
      if (!isValid) {
        reply.code(401);
        return { error: 'Invalid password' };
      }
      
      return {
        success: true,
        message: 'Password verified successfully'
      };
    } catch (error) {
      reply.code(500);
      return { error: 'Failed to verify password', details: error.message };
    }
  }

  static async createUser(request, reply) {
    try {
      // XSS middleware already sanitized the input
      const user = await UserService.createUser(request.body);
      reply.code(201);
      return {
        success: true,
        message: 'User created successfully',
        user
      };
    } catch (error) {
      if (error.code === 'SQLITE_CONSTRAINT' && error.message.includes('UNIQUE')) {
        reply.code(409);
        return { error: 'Email already exists' };
      }
      
      reply.code(500);
      return { error: 'Failed to create user', details: error.message };
    }
  }

  static async updateUser(request, reply) {
    try {
      const { id } = request.params;
      
      // XSS middleware already sanitized the input
      const user = await UserService.updateUser(id, request.body);
      
      return {
        success: true,
        message: 'User updated successfully',
        user
      };
    } catch (error) {
      if (error.message === 'User not found') {
        reply.code(404);
        return { error: 'User not found' };
      }
      
      if (error.code === 'SQLITE_CONSTRAINT' && error.message.includes('UNIQUE')) {
        reply.code(409);
        return { error: 'Email already exists' };
      }
      
      reply.code(500);
      return { error: 'Failed to update user', details: error.message };
    }
  }

  static async patchUser(request, reply) {
    try {
      const { id } = request.params;
      const { email, passwordString } = request.body;
      
      // XSS middleware already sanitized the input
      let user;
      
      if (email && passwordString) {
        user = await UserService.updateUser(id, { email, passwordString });
      } else if (email) {
        user = await UserService.updateUserEmail(id, email);
      } else if (passwordString) {
        user = await UserService.updateUserPassword(id, passwordString);
      } else {
        reply.code(400);
        return { error: 'At least one field (email or passwordString) is required' };
      }
      
      return {
        success: true,
        message: 'User updated successfully',
        user
      };
    } catch (error) {
      if (error.message === 'User not found') {
        reply.code(404);
        return { error: 'User not found' };
      }
      
      if (error.code === 'SQLITE_CONSTRAINT' && error.message.includes('UNIQUE')) {
        reply.code(409);
        return { error: 'Email already exists' };
      }
      
      reply.code(500);
      return { error: 'Failed to update user', details: error.message };
    }
  }

  static async loginUser(request, reply) {
    try {
      const { email, passwordString } = request.body;
      
      // XSS middleware already sanitized the input
      const user = await UserService.authenticateUser(email, passwordString);
      
      if (!user) {
        reply.code(401);
        return { error: 'Invalid credentials' };
      }

	  const  authResult = await UserService.generateAuthToken(user, request.server);

	  // Set secure HTTP-only cookie
	  reply.setCookie('authToken', authResult.token, {
		httpOnly: true,
		secure: process.env.NODE_ENV === 'production',
		sameSite: 'strict',
		maxAge: 60 * 60 * 1000, // 1 hour
		path: '/' 
	  });
      
      return {
        success: true,
        message: 'Login successful',
        user: authResult.user,
		token: authResult.token,
		expiresIn: authResult.expiresIn
      };
    } catch (error) {
      reply.code(500);
      return { error: 'Authentication failed', details: error.message };
    }
  }

  static async logoutUser(request, reply) {
	try {
		reply.clearCookie('authToken', {
			path: '/'
		});

		return {
			success: true,
			message: 'Logout successful'
		};
	} catch (error) {
		reply.code(500);
		return { error: 'Logout failed', details: error.message };
	}
  }

  static async deleteUser(request, reply) {
    try {
      const { id } = request.params;
      await UserService.deleteUser(id);
      
      return {
        success: true,
        message: 'User deleted successfully'
      };
    } catch (error) {
      if (error.message === 'User not found') {
        reply.code(404);
        return { error: 'User not found' };
      }
      
      reply.code(500);
      return { error: 'Failed to delete user', details: error.message };
    }
  }
}

export default UserController;