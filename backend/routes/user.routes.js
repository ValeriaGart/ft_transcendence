import UserController from '../controllers/user.controller.js';
import { 
  userBodySchema, 
  userPatchSchema, 
  userParamsSchema, 
  loginSchema 
} from '../schemas/user.schemas.js';

async function routes(fastify, options) {
  // Public route
  fastify.get('/', async (request, reply) => {
    return { hello: 'world' };
  });
  
  
  // Public registration with strict rate limiting
  fastify.post('/users', {
	config: {
	  rateLimit: {
		max: 5, // Only 5 registrations per 15 minutes
		timeWindow: '15 minutes'
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


  // Get current user info
  fastify.get('/users/me', {
	preHandler: [fastify.authenticate]
  }, UserController.getCurrentUser);

  // Get current user authentication type
  fastify.get('/users/me/auth-type', {
	preHandler: [fastify.authenticate]
  }, UserController.getCurrentUserAuthType);

  // Verify current user's password
  fastify.post('/users/me/verify-password', {
	preHandler: [fastify.authenticate]
  }, UserController.verifyCurrentUserPassword);

  //Logout
  fastify.post('/users/logout', {
    preHandler: [fastify.authenticate]
  }, UserController.logoutUser);


  // User can only access their own data or use /users/me
  fastify.get('/users/:id', {
	schema: { params: userParamsSchema },
	preHandler: [fastify.requireOwnership]
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

  // Get all users - for admin or authorized access only
  fastify.get('/users', {
    preHandler: [fastify.authenticate]
  }, UserController.getAllUsers);
}

export default routes;