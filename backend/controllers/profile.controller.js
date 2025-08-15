import ProfileService from '../services/profile.service.js';
import { validateNickname, cleanNickname, nicknameExists } from '../utils/nickname.utils.js';
import { dbGet } from '../config/database.js';
import { sanitizeInput, sanitizeUrl } from '../utils/sanitization.utils.js';

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
      
      // Sanitize profile inputs individually
      const sanitizedBody = { ...request.body };
      if (sanitizedBody.nickname) sanitizedBody.nickname = sanitizeInput(sanitizedBody.nickname);
      if (sanitizedBody.bio) sanitizedBody.bio = sanitizeInput(sanitizedBody.bio);
      if (sanitizedBody.profilePictureUrl) sanitizedBody.profilePictureUrl = sanitizeUrl(sanitizedBody.profilePictureUrl);
      
      const profile = await ProfileService.updateProfile(id, sanitizedBody);
      
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

  static async getCurrentUserProfile(request, reply) {
    try {
      const userId = request.user.userId;
      const profile = await ProfileService.getProfileByUserId(userId);
      
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

  static async patchProfile(request, reply) {
    try {
      const { id } = request.params;
      const { nickname, profilePictureUrl, bio } = request.body;

      const updateFields = {};
      if (nickname !== undefined && nickname !== null) updateFields.nickname = sanitizeInput(nickname);
      if (profilePictureUrl !== undefined) updateFields.profilePictureUrl = sanitizeUrl(profilePictureUrl);
      if (bio !== undefined) updateFields.bio = sanitizeInput(bio);

      if (Object.keys(updateFields).length === 0){
        reply.code(400);
        return { error: 'At least one field (nickname, profilePictureUrl, or bio) is required' };
      }

      // Pre-validate nickname if provided (including empty strings)
      if (nickname !== undefined && nickname !== null) {
        const validation = validateNickname(updateFields.nickname);
        if (!validation.isValid) {
          reply.code(400);
          return { 
            error: 'Invalid nickname format', 
            details: validation.errors,
            suggestions: await ProfileController.generateNicknameSuggestions(nickname || 'user')
          };
        }
      }

      const profile = await ProfileService.updateProfile(id, updateFields);
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
      
      if (error.message === 'Nickname already taken by another user') {
        reply.code(409);
        return { 
          error: 'Nickname already taken', 
          suggestions: await ProfileController.generateNicknameSuggestions(request.body.nickname)
        };
      }
      
      if (error.message.includes('Nickname validation failed')) {
        reply.code(400);
        return { 
          error: 'Invalid nickname format', 
          details: error.message,
          suggestions: await ProfileController.generateNicknameSuggestions(request.body.nickname)
        };
      }
      
      reply.code(500);
      return { error: 'Failed to update profile', details: error.message };
    }
  }

  static async suggestNickname(request, reply) {
    try {
      const { baseNickname } = request.query;
      
      if (!baseNickname) {
        reply.code(400);
        return { error: 'Base nickname is required' };
      }

      const suggestion = await ProfileService.suggestNickname(baseNickname);
      
      return {
        success: true,
        suggestion,
        baseNickname: cleanNickname(baseNickname)
      };
    } catch (error) {
      reply.code(500);
      return { error: 'Failed to generate nickname suggestion', details: error.message };
    }
  }

  static async generateNicknameSuggestions(baseNickname) {
    try {
      const suggestions = [];
      const cleaned = cleanNickname(baseNickname);
      
      // Generate 5 simple numbered suggestions (e.g., "john_1", "john_2", etc.)
      for (let i = 1; i <= 5; i++) {
        const suggestion = `${cleaned}_${i}`;
        const isAvailable = !(await nicknameExists(suggestion));
        if (isAvailable) {
          suggestions.push(suggestion);
        }
      }
      
      return suggestions;
    } catch (error) {
      console.error('Error generating nickname suggestions:', error);
      return [];
    }
  }

  static async checkNicknameAvailability(request, reply) {
    try {
      const { nickname } = request.query;
      
      if (!nickname) {
        reply.code(400);
        return { error: 'Nickname parameter is required' };
      }

      // Validate nickname format
      const validation = validateNickname(nickname);
      if (!validation.isValid) {
        return {
          available: false,
          reason: 'invalid_format',
          errors: validation.errors
        };
      }

      // Check if nickname exists
      const existingProfile = await dbGet(
        'SELECT userId FROM profiles WHERE nickname = ?',
        [nickname]
      );

      return {
        available: !existingProfile,
        nickname: nickname
      };
    } catch (error) {
      reply.code(500);
      return { error: 'Failed to check nickname availability', details: error.message };
    }
  }
}

export default ProfileController;