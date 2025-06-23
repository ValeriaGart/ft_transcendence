import { dbRun, dbGet, dbAll } from '../config/database.js';

class ProfileService {
  static async getAllProfiles() {
    const profiles = await dbAll('SELECT * FROM profiles');
    return profiles;
  }

  static async getProfileById(id) {
    const profile = await dbGet('SELECT * FROM profiles WHERE id = ?', [id]);
    return profile;
  }

  static async getProfileByUserId(userId) {
    const profile = await dbGet('SELECT * FROM profiles WHERE userId = ?', [userId]);
    return profile;
  }

  static async updateProfile(id, profileData) {
    const { nickname, profilePictureUrl, bio } = profileData;
    
    const result = await dbRun(
      'UPDATE profiles SET nickname = ?, profilePictureUrl = ?, bio = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
      [nickname, profilePictureUrl, bio, id]
    );
    
    if (result.changes === 0) {
      throw new Error('Profile not found');
    }
    
    return this.getProfileById(id);
  }

  static async updateProfileField(id, field, value) {
    const allowedFields = ['nickname', 'profilePictureUrl', 'bio'];
    
    if (!allowedFields.includes(field)) {
      throw new Error('Invalid field');
    }

    const result = await dbRun(
      `UPDATE profiles SET ${field} = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`,
      [value, id]
    );
    
    if (result.changes === 0) {
      throw new Error('Profile not found');
    }
    
    return this.getProfileById(id);
  }
}

export default ProfileService;