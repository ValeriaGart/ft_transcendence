import { dbRun, dbGet, dbAll } from '../config/database.js';
import { hashPassword, verifyPassword } from '../utils/password-utils.js';

class UserService {
  static async getAllUsers() {
    const users = await dbAll('SELECT id, email, createdAt, updatedAt FROM users');
    return users;
  }

  static async getUserById(id) {
    const user = await dbGet(
      'SELECT id, email, createdAt, updatedAt FROM users WHERE id = ?',
      [id]
    );
    return user;
  }

  static async getUserByEmail(email) {
    const user = await dbGet(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    return user;
  }

  static async createUser(userData) {
    const { email, passwordString } = userData;
    const hashedPassword = await hashPassword(passwordString);
    
    
    try {
	 		await dbRun('BEGIN TRANSACTION');

      const userResult = await dbRun(
        'INSERT INTO users (email, passwordHash) VALUES (?, ?)',
        [email, hashedPassword]
      );

      const userId = userResult.lastID;

      await dbRun(
        'INSERT INTO profiles (userId, nickname, bio, profilePictureUrl) VALUES (?, NULL, NULL, NULL)',
        [userId]
      );

      await dbRun('COMMIT');
      
      return { id: userId, email };
    } catch (error) {
			try {
				await dbRun('ROLLBACK');
			} catch (rollbackError) {
				console.error('Rollback failed:', rollbackError);
			}
      throw error;
    }
  }

  static async updateUserEmail(id, email) {
    const result = await dbRun(
      'UPDATE users SET email = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
      [email, id]
    );
    
    if (result.changes === 0) {
      throw new Error('User not found');
    }
    
    return this.getUserById(id);
  }

  static async updateUserPassword(id, passwordString) {
    const hashedPassword = await hashPassword(passwordString);
    
    const result = await dbRun(
      'UPDATE users SET passwordHash = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
      [hashedPassword, id]
    );
    
    if (result.changes === 0) {
      throw new Error('User not found');
    }
    
    return this.getUserById(id);
  }

  static async updateUser(id, userData) {
    const { email, passwordString } = userData;
    const hashedPassword = await hashPassword(passwordString);
    
    const result = await dbRun(
      'UPDATE users SET email = ?, passwordHash = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
      [email, hashedPassword, id]
    );
    
    if (result.changes === 0) {
      throw new Error('User not found');
    }
    
    return this.getUserById(id);
  }

  static async authenticateUser(email, passwordString) {
    const user = await this.getUserByEmail(email);
    
    if (!user) {
      return null;
    }

    const isPasswordValid = await verifyPassword(user.passwordHash, passwordString);
    
    if (!isPasswordValid) {
      return null;
    }

    const { passwordHash, ...userData } = user;
    return userData;
  }

  static async generateAuthToken(user, fastify) {
    const token = fastify.jwt.sign({
      userId: user.id,
      email: user.email
    });

    return {
      user,
      token,
      expiresIn: process.env.JWT_EXPIRES_IN || '1h'
    };
  }

  static async deleteUser(id) {
    const result = await dbRun('DELETE FROM users WHERE id = ?', [id]);
    
    if (result.changes === 0) {
      throw new Error('User not found');
    }
    
    return { success: true };
  }
}

export default UserService;