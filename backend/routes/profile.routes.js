import ProfileController from '../controllers/profile.controller.js';
import ProfileService from '../services/profile.service.js';
import {
  profileBodySchema,
  profileParamsSchema,
  profilePatchSchema
} from '../schemas/profile.schemas.js';

async function routes(fastify, options) {
  // Public route - get all profiles (assuming profiles are meant to be public like a user directory)
  fastify.get('/profiles', ProfileController.getAllProfiles);
  
  // Public route - get specific profile by ID (assuming profiles are meant to be public)
  fastify.get('/profiles/:id', {
    schema: { params: profileParamsSchema }
  }, ProfileController.getProfileById);

  // Public route - get profile by user ID (using existing service method)
  fastify.get('/profiles/user/:userId', {
    schema: { params: { type: 'object', properties: { userId: { type: 'integer' } }, required: ['userId'] } }
  }, async (request, reply) => {
    try {
      const { userId } = request.params;
      const profile = await ProfileService.getProfileByUserId(userId);
      
      if (!profile) {
        reply.code(404);
        return { error: 'Profile not found' };
      }
      
      return profile;
    } catch (error) {
      reply.code(500);
      return { error: 'Failed to get profile', details: error.message };
    }
  });

  // Protected route - get current user's profile
  fastify.get('/profiles/me', {
    preHandler: [fastify.authenticate]
  }, ProfileController.getCurrentUserProfile);
  
  // Protected route - update profile (only owner can modify)
  fastify.put('/profiles/:id', {
    schema: {
      body: profileBodySchema,
      params: profileParamsSchema
    },
	preHandler: [fastify.requireProfileOwnership]
  }, ProfileController.updateProfile);

  // Protected route - patch profile (only owner can modify)
  fastify.patch('/profiles/:id', {
    schema: {
      body: profilePatchSchema,
      params: profileParamsSchema
    },
	preHandler: [fastify.requireProfileOwnership]
  }, ProfileController.patchProfile);

  // Add nickname suggestion endpoint
  fastify.get('/profiles/suggest-nickname', {
    schema: {
      querystring: {
        type: 'object',
        properties: {
          baseNickname: { type: 'string', minLength: 2 }
        },
        required: ['baseNickname']
      }
    }
  }, ProfileController.suggestNickname);

  // Add nickname availability check endpoint
  fastify.get('/profiles/check-nickname', {
    schema: {
      querystring: {
        type: 'object',
        properties: {
          nickname: { type: 'string', minLength: 2 }
        },
        required: ['nickname']
      }
    }
  }, ProfileController.checkNicknameAvailability);
}

export default routes;