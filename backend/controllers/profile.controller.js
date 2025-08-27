import ProfileService from '../services/profile.service.js';
import { validateNickname, cleanNickname, nicknameExists } from '../utils/nickname.utils.js';
import { dbGet } from '../config/database.js';
import { log, DEBUG, INFO, WARN, ERROR } from '../utils/logger.utils.js';
import { validateFile, generateUniqueFilename, saveFile, getFileUrl, cleanupOldAvatars } from '../utils/file-upload.utils.js';

class ProfileController {
  static async getAllProfiles(request, reply) {
    try {
      const profiles = await ProfileService.getAllProfiles();
      return profiles;
    } catch (error) {
      log("getAllProfiles failed", WARN);
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
      log("getProfileById failed", WARN);
      reply.code(500);
      return { error: 'Failed to retrieve profile', details: error.message };
    }
  }

  static async updateProfile(request, reply) {
    try {
      const { id } = request.params;
      // No need to sanitize again - XSS middleware already handled this
      const profile = await ProfileService.updateProfile(id, request.body);

      return {
        success: true,
        message: 'Profile updated successfully',
        profile
      };
    } catch (error) {
      if (error.message === 'Profile not found') {
        log("updateProfile failed: profile not found", WARN);
        reply.code(404);
        return { error: 'Profile not found' };
      }
      log("updateProfile failed", WARN);

      reply.code(500);
      return { error: 'Failed to update profile', details: error.message };
    }
  }

  static async getCurrentUserProfile(request, reply) {
    try {
      const userId = request.user.userId;
      const profile = await ProfileService.getProfileByUserId(userId);

      if (!profile) {
        log("getCurrentUserProfile failed: Profile not found", WARN);
        reply.code(404);
        return { error: 'Profile not found' };
      }

      return profile;
    } catch (error) {
      log("getCurrentUserProfile failed", WARN);
      reply.code(500);
      return { error: 'Failed to retrieve profile', details: error.message };
    }
  }

  static async patchProfile(request, reply) {
    try {
      const { id } = request.params;
      const { nickname, profilePictureUrl, bio } = request.body;

      const updateFields = {};
      if (nickname !== undefined && nickname !== null) updateFields.nickname = nickname;
      if (profilePictureUrl !== undefined) updateFields.profilePictureUrl = profilePictureUrl;
      if (bio !== undefined) updateFields.bio = bio;

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
        log("patchProfile failed: profile not found", WARN);
        reply.code(404);
        return { error: 'Profile not found' };
      }

      if (error.message === 'Nickname already taken by another user') {
        log("patchProfile failed: nickname already taken", WARN);
        reply.code(409);
        return { 
          error: 'Nickname already taken', 
          suggestions: await ProfileController.generateNicknameSuggestions(request.body.nickname)
        };
      }

      if (error.message.includes('Nickname validation failed')) {
        log("patchProfile failed: nickname validation failed", WARN);
        reply.code(400);
        return { 
          error: 'Invalid nickname format', 
          details: error.message,
          suggestions: await ProfileController.generateNicknameSuggestions(request.body.nickname)
        };
      }
      log("patchProfile failed", WARN);

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
      log("suggestNickname failed", WARN);
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
      log(`Error generating nickname suggestions: ${error}`, WARN);
      return [];
    }
  }

  static async checkNicknameAvailability(request, reply) {
    try {
      const { nickname } = request.query;

      if (!nickname) {
        log("checkNicknameAvailability failed: Nickname parameter is required", WARN);
        reply.code(400);
        return { error: 'Nickname parameter is required' };
      }

      // Validate nickname format
      const validation = validateNickname(nickname);
      if (!validation.isValid) {
        log("checkNicknameAvailability failed: Nickname is invalid", WARN);
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
      log("checkNicknameAvailability failed", WARN);
      reply.code(500);
      return { error: 'Failed to check nickname availability', details: error.message };
    }
  }

  static async uploadAvatar(request, reply) {
    try {
      const { id } = request.params;
      const userId = request.user.userId;
      
      // Get the uploaded file
      const data = await request.file();
      if (!data) {
        log("uploadAvatar failed: no file uploaded", WARN);
        reply.code(400);
        return { error: 'No file uploaded' };
      }

      // Validate the file
      const validation = validateFile(data, 'AVATAR');
      if (!validation.valid) {
        log("uploadAvatar failed: invalid file", WARN);
        reply.code(400);
        return { error: 'Invalid file', details: validation.errors };
      }

      // Generate unique filename
      const filename = generateUniqueFilename(data.filename, userId);
      
      // Save the file
      const filePath = await saveFile(data, filename, 'AVATAR');
      
      // Get the public URL
      const publicUrl = getFileUrl(filePath);
      
      // Get current profile to check if there's an existing avatar
      const currentProfile = await ProfileService.getProfileById(id);
      const currentAvatarUrl = currentProfile?.profilePictureUrl;
      
      // Update profile with new avatar URL
      const updatedProfile = await ProfileService.updateProfile(id, {
        profilePictureUrl: publicUrl
      });
      
      // Clean up old avatar files if they exist
      if (currentAvatarUrl && currentAvatarUrl !== publicUrl) {
        await cleanupOldAvatars(userId, publicUrl);
      }
      
      return {
        success: true,
        message: 'Avatar uploaded successfully',
        avatarUrl: publicUrl,
        profile: updatedProfile
      };
      
    } catch (error) {
      log("uploadAvatar failed", WARN);
      reply.code(500);
      return { error: 'Failed to upload avatar', details: error.message };
    }
  }
}

export default ProfileController;