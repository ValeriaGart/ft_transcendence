import bcrypt from 'bcrypt';
import { verifyPassword as verifyArgon2 } from '../utils/password-utils.js';
import { dbRun, dbGet } from '../config/database.js';
import { AUTH_CONFIG } from '../config/auth.config.js';
import { generateNicknameFromUserData, validateNickname, generateUniqueNickname } from '../utils/nickname.utils.js';
import { log, DEBUG, INFO, WARN, ERROR } from '../utils/logger.utils.js';

class AuthService {
  static async findUserByEmail(email) {
    try {
      return await dbGet(
        'SELECT * FROM users WHERE email = ? AND isActive = 1',
        [email]
      );
    } catch (error) {
      log('Error finding user by email: ' + error, WARN);
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
      log('Error finding user by ID: ' + error, WARN);
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
      log('Error finding user by Google ID: ' + error, WARN);
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

      // Generate unique nickname from email prefix
      const baseNickname = userData.email.split('@')[0];
      const uniqueNickname = await generateUniqueNickname(baseNickname);

      await dbRun(
        'INSERT INTO profiles (userId, nickname, profilePictureUrl, bio) VALUES (?, ?, ?, ?)',
        [result.lastID, uniqueNickname, 'profile_no.svg', null]
      );

      await dbRun('COMMIT');
      
      return await this.findUserById(result.lastID);
    } catch (error) {
      try {
        await dbRun('ROLLBACK');
      } catch (rollbackError) {
        log('Rollback failed: ' + rollbackError, ERROR);
      }
      log('Error creating Google user: ' + error, WARN);
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

      // Generate unique nickname using the utility function
      const baseNickname = userData.name || userData.email.split('@')[0];
      const uniqueNickname = await generateUniqueNickname(baseNickname);
      
      await dbRun(
        'INSERT INTO profiles (userId, nickname, profilePictureUrl, bio) VALUES (?, ?, ?, ?)',
        [
          result.lastID, 
          uniqueNickname,
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
        log('Rollback failed: ' + rollbackError, ERROR);
      }
      log('Error creating password user: ' + error, WARN);
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
      log('Error updating last login: ' + error, ERROR);
      throw error;
    }
  }

  static async verifyPassword(password, hash) {
    try {
      // without this change password change doesnt work : from V
      // Try bcrypt first
      try {
        if (await bcrypt.compare(password, hash)) return true;
      } catch {}
      // Then try argon2
      try {
        if (await verifyArgon2(hash, password)) return true;
      } catch {}
      log('Password verification failed for provided hash format', WARN);
      return false;
    } catch (error) {
      log('Error verifying password: ' + error, WARN);
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
      log('Error incrementing failed login attempts: ' + error, ERROR);
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
      log('Error resetting failed login attempts: ' + error, ERROR);
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
      log('Error updating user: ' + error, ERROR);
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
      log('Error changing password: ' + error, ERROR);
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
      log('Error deactivating user: ' + error, ERROR);
      throw error;
    }
  }
}

export default AuthService;
