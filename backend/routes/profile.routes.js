import ProfileController from '../controllers/profile.controller.js';
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
}

export default routes;