import fp from 'fastify-plugin';
import jwt from '@fastify/jwt';

async function authPlugin(fastify, options) {
  // Register JWT plugin
  await fastify.register(jwt, {
    secret: process.env.JWT_SECRET,
    sign: {
      expiresIn: process.env.JWT_EXPIRES_IN || '1h'
    }
  });

  // Authentication decorator - validates JWT token
  fastify.decorate('authenticate', async function(request, reply) {
    try {
      await request.jwtVerify();
    } catch (err) {
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
      
      // Get profile to check ownership
      const { dbGet } = await import('../config/database.js');
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