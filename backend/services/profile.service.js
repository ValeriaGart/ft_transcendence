import { dbRun, dbGet, dbAll } from '../config/database.js';

class ProfileService {
  static async getAllProfiles() {
    const profiles = await dbAll('SELECT * FROM profiles');
    return profiles;
  }


  static async getIdByNick(nick) {
    const id = await dbGet(
      'SELECT userId FROM profiles WHERE nickname = ?',
      [nick]
    );
    if (!id) {
      throw new Error (`[ProfileService] No such user with nickname ${nick} found`)
    }
    return id;
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
    
    // Build dynamic update query based on provided fields (added by ai)
    const updateFields = [];
    const updateValues = [];
    
    if (nickname !== undefined) {
      updateFields.push('nickname = ?');
      updateValues.push(nickname);
    }
    if (profilePictureUrl !== undefined) {
      updateFields.push('profilePictureUrl = ?');
      updateValues.push(profilePictureUrl);
    }
    if (bio !== undefined) {
      updateFields.push('bio = ?');
      updateValues.push(bio);
    }
    
    if (updateFields.length === 0) {
      throw new Error('No fields to update');
    }
    
    updateFields.push('updatedAt = CURRENT_TIMESTAMP');
    updateValues.push(id);
    //end of added by ai
    
    const result = await dbRun(
      /*'UPDATE profiles SET nickname = ?, profilePictureUrl = ?, bio = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
      [nickname, profilePictureUrl, bio, id] */
      //added by ai:
      `UPDATE profiles SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
      //end of added by ai
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