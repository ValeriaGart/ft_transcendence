import ProfileController from '../controllers/profile.controller.js';
import {
  profileBodySchema,
  profileParamsSchema,
  profilePatchSchema
} from '../schemas/profile.schemas.js';

async function routes(fastify, options) {
  fastify.get('/profiles', ProfileController.getAllProfiles);
  
  fastify.get('/profiles/:id', {
    schema: { params: profileParamsSchema }
  }, ProfileController.getProfileById);
  
  fastify.put('/profiles/:id', {
    schema: {
      body: profileBodySchema,
      params: profileParamsSchema
    },
	preHandler: [fastify.requireProfileOwnership]
  }, ProfileController.updateProfile);

  fastify.patch('/profiles/:id', {
    schema: {
      body: profilePatchSchema,
      params: profileParamsSchema
    },
	preHandler: [fastify.requireProfileOwnership]
  }, ProfileController.patchProfile);
}

export default routes;