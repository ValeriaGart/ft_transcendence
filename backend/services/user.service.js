import { dbRun, dbGet, dbAll } from '../config/database.js';
import { hashPassword, verifyPassword } from '../utils/password-utils.js';
import { log, DEBUG, INFO, WARN, ERROR } from '../utils/logger.utils.js';

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

  static async getUserWithAuthInfo(id) {
    const user = await dbGet(
      'SELECT id, email, passwordHash, googleId, emailVerified, createdAt, updatedAt FROM users WHERE id = ?',
      [id]
    );
    return user;
  }

  static async verifyUserPassword(userId, password) {
    try {
      const user = await dbGet(
        'SELECT passwordHash FROM users WHERE id = ? AND isActive = 1',
        [userId]
      );
      
      if (!user || !user.passwordHash) {
        log('Password verification failed: no user or no password hash', INFO);
        return false;
      }
      
      // Detect hash type and use appropriate verification method
      let result = false;
      if (user.passwordHash.startsWith('$2b$') || user.passwordHash.startsWith('$2a$')) {
        // bcrypt hash - import bcrypt and verify
        const bcrypt = await import('bcrypt');
        result = await bcrypt.default.compare(password, user.passwordHash);
        log('Using bcrypt verification for user: ' + userId, DEBUG);
      } else if (user.passwordHash.startsWith('$argon2')) {
        // Argon2 hash - use our utility
        result = await verifyPassword(user.passwordHash, password);
        log('Using Argon2 verification for user: ' + userId, DEBUG);
      } else {
        log('Unknown hash format for user: ' + userId + ', Hash prefix: ' + user.passwordHash.substring(0, 10), WARN);
        return false;
      }
      
      log(`Password comparison result: ${JSON.stringify({ userId, isValid: result })}`, DEBUG);
      
      return result;
    } catch (error) {
      log('Error verifying user password:' + error, WARN);
      return false;
    }
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
				log('Rollback failed: ' + rollbackError, ERROR);
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
    //TODO from Yen: I think we need to check whether the user exists in db first and also delete the profile and all the user's data
    const result = await dbRun('DELETE FROM users WHERE id = ?', [id]);
    
    if (result.changes === 0) {
      throw new Error('User not found');
    }
    
    return { success: true };
  }
}

export default UserService;