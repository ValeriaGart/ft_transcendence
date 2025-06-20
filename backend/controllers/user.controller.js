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

  static async createUser(request, reply) {
    try {
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
      const user = await UserService.authenticateUser(email, passwordString);
      
      if (!user) {
        reply.code(401);
        return { error: 'Invalid credentials' };
      }
      
      return {
        success: true,
        message: 'Login successful',
        user
      };
    } catch (error) {
      reply.code(500);
      return { error: 'Authentication failed', details: error.message };
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