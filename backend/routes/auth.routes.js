
import AuthController from '../controllers/auth.controller.js';
import { 
  loginSchema, 
  registerSchema, 
  googleAuthSchema 
} from '../schemas/auth.schemas.js';

async function authRoutes(fastify, options) {
  fastify.post('/auth/google/signup', {
    config: {
      rateLimit: {
        max: 5,
        timeWindow: '15 minutes'
      }
    },
    schema: { body: googleAuthSchema }
  }, AuthController.googleSignup);

  fastify.post('/auth/google/signin', {
    config: {
      rateLimit: {
        max: 10,
        timeWindow: '15 minutes'
      }
    },
    schema: { body: googleAuthSchema }
  }, AuthController.googleSignin);



  fastify.post('/auth/register', {
    config: {
      rateLimit: {
        max: 5,
        timeWindow: '15 minutes'
      }
    },
    schema: { body: registerSchema }
  }, AuthController.register);

  fastify.post('/auth/login', {
    config: {
      rateLimit: {
        max: 5,
        timeWindow: '15 minutes'
      }
    },
    schema: { body: loginSchema }
  }, AuthController.login);

  fastify.post('/auth/logout', {
    preHandler: [fastify.authenticate]
  }, AuthController.logout);

  fastify.post('/auth/refresh', {
    preHandler: [fastify.authenticate]
  }, AuthController.refresh);

  fastify.get('/auth/me', {
    preHandler: [fastify.authenticate]
  }, AuthController.getCurrentUser);

  fastify.get('/auth/verify', {
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    return { 
      valid: true, 
      user: {
        id: request.user.userId,
        email: request.user.email,
        name: request.user.name
      }
    };
  });
}

export default authRoutes;
