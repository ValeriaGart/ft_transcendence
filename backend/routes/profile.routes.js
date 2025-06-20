
import ProfileController from '../controllers/profile.controller.js';

const profileBodySchema = {
  type: "object",
  properties: {
    nickname: { type: 'string', minLength: 2 },
    profilePictureUrl: { type: 'string', format: "uri" },
    bio: { type: 'string', maxLength: 500 }
  },
  required: ["nickname", "profilePictureUrl", "bio"]
};

const profileParamsSchema = {
  type: "object",
  properties: {
    id: { type: "integer" }
  },
  required: ["id"]
};

async function routes(fastify, options) {
  fastify.get('/profiles', ProfileController.getAllProfiles);
  
  fastify.get('/profiles/:id', {
    schema: { params: profileParamsSchema }
  }, ProfileController.getProfileById);
  
  fastify.put('/profiles/:id', {
    schema: {
      body: profileBodySchema,
      params: profileParamsSchema
    }
  }, ProfileController.updateProfile);
}

export default routes;