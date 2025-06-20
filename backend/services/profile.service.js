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
}

export default ProfileService;