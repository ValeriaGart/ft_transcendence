import UserController from '../controllers/user.controller.js';
import { 
  userBodySchema, 
  userPatchSchema, 
  userParamsSchema, 
  loginSchema 
} from '../schemas/user.schemas.js';

async function routes(fastify, options) {
  // Root route
  fastify.get('/', async (request, reply) => {
    return { hello: 'world' };
  });

  // User routes
  fastify.get('/users', UserController.getAllUsers);
  
  fastify.get('/users/:id', {
    schema: { params: userParamsSchema }
  }, UserController.getUserById);
  
  fastify.post('/users', {
    schema: { body: userBodySchema }
  }, UserController.createUser);
  
  fastify.put('/users/:id', {
    schema: {
      body: userBodySchema,
      params: userParamsSchema
    }
  }, UserController.updateUser);
  
  fastify.patch('/users/:id', {
    schema: {
      body: userPatchSchema,
      params: userParamsSchema
    }
  }, UserController.patchUser);
  
  fastify.delete('/users/:id', {
    schema: { params: userParamsSchema }
  }, UserController.deleteUser);
  
  // Authentication route
  fastify.post('/users/login', {
    schema: { body: loginSchema }
  }, UserController.loginUser);
}

export default routes;