import fp from 'fastify-plugin';
import jwt from '@fastify/jwt';
import { dbGet } from '../config/database.js';
import { log, DEBUG, INFO, WARN, ERROR } from '../utils/logger.utils.js';
import { getAuthConfig } from '../config/auth.config.js';
import SessionService from '../services/session.service.js';

async function authPlugin(fastify, options) {
  const config = getAuthConfig();
  
  // Register JWT plugin with fallback secret
  await fastify.register(jwt, {
    secret: config.JWT.SECRET,
    sign: {
      expiresIn: config.JWT.EXPIRES_IN
    }
  });

  // Authentication decorator - validates JWT token from header or cookie
  fastify.decorate('authenticate', async function(request, reply) {
    try {
      // Check if token is in cookie, if so, add it to authorization header
      if (!request.headers.authorization && request.cookies && request.cookies['auth-token']) {
        request.headers.authorization = `Bearer ${request.cookies['auth-token']}`;
      }
      else if (!request.headers.authorization && request.cookies && request.cookies['authToken']) {
        request.headers.authorization = `Bearer ${request.cookies['authToken']}`;
      }
      
      await request.jwtVerify();
      const { userId, sessionId } = request.user;
  const ok = await SessionService.validateSession(userId, sessionId);
  if (!ok) return reply.code(401).send({ error: 'SESSION_INVALID' });
  await SessionService.touch(userId);
    } catch (err) {
      log("[auth.js] Unauthorized: " + err.message, WARN);
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
      if (request.user?.userId) {
  const ok = await SessionService.validateSession(request.user.userId, request.user.sessionId);
  if (ok) await SessionService.touch(request.user.userId); else request.user = null;
      }
    } catch (err) { request.user = null; }
  });

  // Resource ownership validation
  fastify.decorate('requireOwnership', async function(request, reply) {
    try {
      await request.jwtVerify();
      const { userId, sessionId } = request.user;
  const ok = await SessionService.validateSession(userId, sessionId);
  if (!ok) return reply.code(401).send({ error: 'SESSION_INVALID' });
  await SessionService.touch(userId);
      
      const resourceId = parseInt(request.params.id);
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
      const { userId, sessionId } = request.user;
  const ok = await SessionService.validateSession(userId, sessionId);
  if (!ok) return reply.code(401).send({ error: 'SESSION_INVALID' });
  await SessionService.touch(userId);
      
      const profileId = parseInt(request.params.id);
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