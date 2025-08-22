/**
 * XSS Protection Middleware
 * Automatically sanitizes all incoming request data to prevent XSS attacks
 */

import { sanitizeInput } from '../utils/sanitization.utils.js';

/**
 * Deep sanitize an object or array recursively
 * @param {any} obj - The object to sanitize
 * @returns {any} Sanitized object
 */
function deepSanitize(obj) {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'string') {
    return sanitizeInput(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map(item => deepSanitize(item));
  }

  if (typeof obj === 'object') {
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = deepSanitize(value);
    }
    return sanitized;
  }

  // For primitives (numbers, booleans, etc.)
  return obj;
}

/**
 * Middleware to sanitize request data
 * @param {Object} request - Fastify request object
 * @param {Object} reply - Fastify reply object
 * @param {Function} done - Fastify done callback
 */
export function xssProtectionMiddleware(request, reply, done) {
  try {
    // Sanitize request body
    if (request.body && typeof request.body === 'object') {
      request.body = deepSanitize(request.body);
    }

    // Sanitize query parameters
    if (request.query && typeof request.query === 'object') {
      request.query = deepSanitize(request.query);
    }

    // Sanitize URL parameters
    if (request.params && typeof request.params === 'object') {
      request.params = deepSanitize(request.params);
    }

    // Sanitize headers that might contain user data
    const headersToSanitize = ['user-agent', 'referer'];
    for (const header of headersToSanitize) {
      if (request.headers[header]) {
        request.headers[header] = sanitizeInput(request.headers[header]);
      }
    }

    done();
  } catch (error) {
    reply.code(500).send({ 
      error: 'Request sanitization failed', 
      details: 'Invalid request data format' 
    });
  }
}

/**
 * Plugin to register XSS protection middleware globally
 * @param {Object} fastify - Fastify instance
 * @param {Object} opts - Plugin options
 * @param {Function} done - Plugin done callback
 */
export function xssProtectionPlugin(fastify, opts, done) {
  // Add the middleware to all routes
  fastify.addHook('preHandler', xssProtectionMiddleware);
  
  // Add security headers
  fastify.addHook('onSend', async (request, reply, payload) => {
    reply.header('X-Content-Type-Options', 'nosniff');
    reply.header('X-Frame-Options', 'DENY');
    reply.header('X-XSS-Protection', '1; mode=block');
    reply.header('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    return payload;
  });

  done();
}

export default { xssProtectionMiddleware, xssProtectionPlugin };
