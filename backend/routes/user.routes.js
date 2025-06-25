import UserController from '../controllers/user.controller.js';
import { 
  userBodySchema, 
  userPatchSchema, 
  userParamsSchema, 
  loginSchema 
} from '../schemas/user.schemas.js';

async function routes(fastify, options) {
  // Apply rate limiting to all routes
  await fastify.register(import('@fastify/rate-limit'), {
    max: 100,
    timeWindow: '1 minute'
  });

  // Public route
  fastify.get('/', async (request, reply) => {
    return { hello: 'world' };
  });
  
  // Public registration
  fastify.post('/users', {
	config: {
	  rateLimit: {
		max: 10,
		timeWindow: '1 minute'
	  }
	},
    schema: { body: userBodySchema }
  }, UserController.createUser);
  
  // Public login
  fastify.post('/users/login', {
	config: {
	  rateLimit: {
		max: 5,
		timeWindow: '15 minutes'
	  }
	},
	schema: { body: loginSchema }
  }, UserController.loginUser);


  // Protected routes -  requires authentication
  // Get current user info
  fastify.get('/users/me', {
	preHandler: [fastify.authenticate]
  }, UserController.getCurrentUser);

  //Logout
  fastify.post('/users/logout', {
    preHandler: [fastify.authenticate]
  }, UserController.logoutUser);

  // User routes but protected
  fastify.get('/users', {
	preHandler: [fastify.authenticate]
  }, UserController.getAllUsers);

  fastify.get('/users/:id', {
	schema: { params: userParamsSchema },
	preHandler: [fastify.authenticate]
  }, UserController.getUserById);


  // User management routes - requires ownership validation
  fastify.put('/users/:id', {
	schema: {
	  body: userBodySchema,
	  params: userParamsSchema
	},
	preHandler: [fastify.requireOwnership]
  }, UserController.updateUser);
  
  fastify.patch('/users/:id', {
	schema: {
	  body: userPatchSchema,
	  params: userParamsSchema
	},
	preHandler: [fastify.requireOwnership]
  }, UserController.patchUser);
  
  fastify.delete('/users/:id', {
	schema: { params: userParamsSchema },
	preHandler: [fastify.requireOwnership]
  }, UserController.deleteUser);
}

export default routes;