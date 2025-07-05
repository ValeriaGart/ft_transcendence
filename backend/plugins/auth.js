import fp from 'fastify-plugin';
import jwt from '@fastify/jwt';
import { dbGet } from '../config/database.js';
import { AUTH_CONFIG } from '../config/auth.config.js';

async function authPlugin(fastify, options) {
  await fastify.register(jwt, {
    secret: AUTH_CONFIG.JWT.SECRET,
    sign: {
      expiresIn: AUTH_CONFIG.JWT.EXPIRES_IN
    }
  });

  // Authentication decorator - validates JWT token from header or cookie
  fastify.decorate('authenticate', async function(request, reply) {
    try {
      console.log('Authentication check for:', request.url);
      console.log('Headers authorization:', request.headers.authorization ? 'present' : 'missing');
      console.log('Cookies:', request.cookies ? Object.keys(request.cookies) : 'no cookies');
      
      // Check if token is in cookie, if so, add it to authorization header
      if (!request.headers.authorization && request.cookies && request.cookies['auth-token']) {
        console.log('Found auth-token in cookie, adding to authorization header');
        console.log('Cookie token (first 20 chars):', request.cookies['auth-token'].substring(0, 20));
        request.headers.authorization = `Bearer ${request.cookies['auth-token']}`;
      }

      console.log('Final authorization header:', request.headers.authorization ? 'present' : 'missing');
      
      await request.jwtVerify();
      console.log('JWT verification successful for user:', request.user?.userId);
    } catch (err) {
      console.log('JWT verification failed:', err.message);
      reply.code(401).send({ 
        error: 'Unauthorized', 
        message: 'Invalid or missing token' 
      });
    }
  });

  // Optional authentication - doesn't fail if no token
  fastify.decorate('optionalAuth', async function(request, reply) {
    try {
      await request.jwtVerify();
    } catch (err) {
      request.user = null;
    }
  });

  // Resource ownership validation
  fastify.decorate('requireOwnership', async function(request, reply) {
    try {
      await request.jwtVerify();
      
      const resourceId = parseInt(request.params.id);
      const userId = request.user.userId;
      
      if (resourceId !== userId) {
        reply.code(403).send({ 
          error: 'Forbidden', 
          message: 'Access denied: insufficient permissions' 
        });
      }
    } catch (err) {
      reply.code(401).send({ 
        error: 'Unauthorized', 
        message: 'Invalid or missing token' 
      });
    }
  });

  // Profile ownership validation
  fastify.decorate('requireProfileOwnership', async function(request, reply) {
    try {
      await request.jwtVerify();
      
      const profileId = parseInt(request.params.id);
      const userId = request.user.userId;
      
      const profile = await dbGet('SELECT userId FROM profiles WHERE id = ?', [profileId]);
      
      if (!profile || profile.userId !== userId) {
        reply.code(403).send({ 
          error: 'Forbidden', 
          message: 'Access denied: insufficient permissions' 
        });
      }
    } catch (err) {
      reply.code(401).send({ 
        error: 'Unauthorized', 
        message: 'Invalid or missing token' 
      });
    }
  });
}

export default fp(authPlugin);