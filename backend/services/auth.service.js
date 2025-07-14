import bcrypt from 'bcrypt';
import { dbRun, dbGet } from '../config/database.js';
import { AUTH_CONFIG } from '../config/auth.config.js';

class AuthService {
  static async findUserByEmail(email) {
    try {
      return await dbGet(
        'SELECT * FROM users WHERE email = ? AND isActive = 1',
        [email]
      );
    } catch (error) {
      console.error('Error finding user by email:', error);
      throw error;
    }
  }

  static async findUserById(id) {
    try {
      return await dbGet(
        'SELECT * FROM users WHERE id = ? AND isActive = 1',
        [id]
      );
    } catch (error) {
      console.error('Error finding user by ID:', error);
      throw error;
    }
  }

  static async findUserByGoogleId(googleId) {
    try {
      return await dbGet(
        'SELECT * FROM users WHERE googleId = ? AND isActive = 1',
        [googleId]
      );
    } catch (error) {
      console.error('Error finding user by Google ID:', error);
      throw error;
    }
  }

  static async createGoogleUser(userData) {
    try {
      await dbRun('BEGIN TRANSACTION');

      const result = await dbRun(
        `INSERT INTO users (email, googleId, emailVerified, lastLoginAt)
         VALUES (?, ?, ?, CURRENT_TIMESTAMP)`,
        [
          userData.email,
          userData.googleId,
          userData.emailVerified ? 1 : 0
        ]
      );

      // Create corresponding profile entry with Google data
      await dbRun(
        'INSERT INTO profiles (userId, nickname, profilePictureUrl, bio) VALUES (?, ?, ?, ?)',
        [result.lastID, userData.name, 'profile_no.svg', null]
      );

      await dbRun('COMMIT');
      
      return await this.findUserById(result.lastID);
    } catch (error) {
      try {
        await dbRun('ROLLBACK');
      } catch (rollbackError) {
        console.error('Rollback failed:', rollbackError);
      }
      console.error('Error creating Google user:', error);
      throw error;
    }
  }

  static async createPasswordUser(userData) {
    try {
      await dbRun('BEGIN TRANSACTION');

      // Hash password
      const passwordHash = await bcrypt.hash(userData.password, AUTH_CONFIG.PASSWORD.SALT_ROUNDS);

      const result = await dbRun(
        `INSERT INTO users (email, passwordHash, lastLoginAt)
         VALUES (?, ?, CURRENT_TIMESTAMP)`,
        [userData.email, passwordHash]
      );

      // Always create a corresponding profile entry (with default values)
      const nickname = userData.name || userData.email.split('@')[0];
      
      await dbRun(
        'INSERT INTO profiles (userId, nickname, profilePictureUrl, bio) VALUES (?, ?, ?, ?)',
        [
          result.lastID, 
          nickname,
          'profile_no.svg', 
          null 
        ]
      );

      await dbRun('COMMIT');

      return await this.findUserById(result.lastID);
    } catch (error) {
      try {
        await dbRun('ROLLBACK');
      } catch (rollbackError) {
        console.error('Rollback failed:', rollbackError);
      }
      console.error('Error creating password user:', error);
      throw error;
    }
  }

  static async updateUserGoogleId(userId, googleId) {
    try {
      await dbRun(
        'UPDATE users SET googleId = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
        [googleId, userId]
      );
    } catch (error) {
      console.error('Error updating user Google ID:', error);
      throw error;
    }
  }

  static async updateLastLogin(userId) {
    try {
      await dbRun(
        'UPDATE users SET lastLoginAt = CURRENT_TIMESTAMP, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
        [userId]
      );
    } catch (error) {
      console.error('Error updating last login:', error);
      throw error;
    }
  }

  static async verifyPassword(password, hash) {
    try {
      return await bcrypt.compare(password, hash);
    } catch (error) {
      console.error('Error verifying password:', error);
      return false;
    }
  }

  static async incrementFailedLoginAttempts(userId) {
    try {
      // Get current failed attempts
      const user = await dbGet('SELECT failedLoginAttempts FROM users WHERE id = ?', [userId]);
      const attempts = (user?.failedLoginAttempts || 0) + 1;

      // Lock account if max attempts reached
      if (attempts >= AUTH_CONFIG.SECURITY.MAX_LOGIN_ATTEMPTS) {
        const lockUntil = new Date(Date.now() + AUTH_CONFIG.SECURITY.LOCKOUT_DURATION);
        await dbRun(
          `UPDATE users SET 
           failedLoginAttempts = ?, 
           lockedUntil = ?, 
           updatedAt = CURRENT_TIMESTAMP 
           WHERE id = ?`,
          [attempts, lockUntil.toISOString(), userId]
        );
      } else {
        await dbRun(
          `UPDATE users SET 
           failedLoginAttempts = ?, 
           updatedAt = CURRENT_TIMESTAMP 
           WHERE id = ?`,
          [attempts, userId]
        );
      }
    } catch (error) {
      console.error('Error incrementing failed login attempts:', error);
      throw error;
    }
  }

  static async resetFailedLoginAttempts(userId) {
    try {
      await dbRun(
        `UPDATE users SET 
         failedLoginAttempts = 0, 
         lockedUntil = NULL, 
         updatedAt = CURRENT_TIMESTAMP 
         WHERE id = ?`,
        [userId]
      );
    } catch (error) {
      console.error('Error resetting failed login attempts:', error);
      throw error;
    }
  }

  static async updateUser(userId, updateData) {
    try {
      const fields = [];
      const values = [];

      // Only update provided fields
      if (updateData.emailVerified !== undefined) {
        fields.push('emailVerified = ?');
        values.push(updateData.emailVerified ? 1 : 0);
      }

      if (fields.length === 0) {
        return await this.findUserById(userId);
      }

      fields.push('updatedAt = CURRENT_TIMESTAMP');
      values.push(userId);

      await dbRun(
        `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
        values
      );

      return await this.findUserById(userId);
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  static async changePassword(userId, newPassword) {
    try {
      const passwordHash = await bcrypt.hash(newPassword, AUTH_CONFIG.PASSWORD.SALT_ROUNDS);
      
      await dbRun(
        'UPDATE users SET passwordHash = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
        [passwordHash, userId]
      );

      return true;
    } catch (error) {
      console.error('Error changing password:', error);
      throw error;
    }
  }

  static async deactivateUser(userId) {
    try {
      await dbRun(
        'UPDATE users SET isActive = 0, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
        [userId]
      );
    } catch (error) {
      console.error('Error deactivating user:', error);
      throw error;
    }
  }
}

export default AuthService;
