import ProfileService from '../services/profile.service.js';

class ProfileController {
  static async getAllProfiles(request, reply) {
    try {
      const profiles = await ProfileService.getAllProfiles();
      return profiles;
    } catch (error) {
      reply.code(500);
      return { error: 'Failed to retrieve profiles', details: error.message };
    }
  }

  static async getProfileById(request, reply) {
    try {
      const { id } = request.params;
      const profile = await ProfileService.getProfileById(id);
      
      if (!profile) {
        reply.code(404);
        return { error: 'Profile not found' };
      }
      
      return profile;
    } catch (error) {
      reply.code(500);
      return { error: 'Failed to retrieve profile', details: error.message };
    }
  }

  static async updateProfile(request, reply) {
    try {
      const { id } = request.params;
      const profile = await ProfileService.updateProfile(id, request.body);
      
      return {
        success: true,
        message: 'Profile updated successfully',
        profile
      };
    } catch (error) {
      if (error.message === 'Profile not found') {
        reply.code(404);
        return { error: 'Profile not found' };
      }
      
      reply.code(500);
      return { error: 'Failed to update profile', details: error.message };
    }
  }
}

export default ProfileController;