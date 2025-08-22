/**
 * Content Security Policy (CSP) configuration
 * Helps prevent XSS attacks by restricting resource loading
 */

/**
 * Generate CSP header value based on environment
 * @param {boolean} isDevelopment - Whether we're in development mode
 * @returns {string} CSP header value
 */
export function generateCSPHeader(isDevelopment = false) {
  const baseCSP = {
    "default-src": ["'self'"],
    "script-src": [
      "'self'",
      isDevelopment ? "'unsafe-eval'" : "",
      // Only include Google domains actually used for auth
      "https://accounts.google.com"
    ].filter(Boolean),
    "style-src": [
      "'self'",
      "'unsafe-inline'", // Needed for some CSS-in-JS solutions
      "https://fonts.googleapis.com"
    ],
    "img-src": [
      "'self'",
      "data:", // For data URLs (base64 images)
      "https:", // Allow HTTPS images
      "blob:" // For generated images
    ],
    "font-src": [
      "'self'",
      "https://fonts.gstatic.com"
    ],
    "connect-src": [
      "'self'",
      isDevelopment ? "ws://localhost:*" : "",
      isDevelopment ? "wss://localhost:*" : "",
      "https://accounts.google.com"
    ].filter(Boolean),
    "media-src": ["'self'"],
    "object-src": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
    "frame-ancestors": ["'none'"],
    "upgrade-insecure-requests": isDevelopment ? [] : [""],
    "block-all-mixed-content": isDevelopment ? [] : [""]
  };

  // Convert to CSP header format
  const cspParts = Object.entries(baseCSP)
    .filter(([_, values]) => values.length > 0)
    .map(([directive, values]) => {
      if (values.length === 1 && values[0] === "") {
        return directive;
      }
      return `${directive} ${values.join(' ')}`;
    });

  return cspParts.join('; ');
}

/**
 * CSP plugin for Fastify
 * @param {Object} fastify - Fastify instance
 * @param {Object} opts - Plugin options
 * @param {Function} done - Plugin done callback
 */
export function cspPlugin(fastify, opts = {}, done) {
  const isDevelopment = process.env.NODE_ENV !== 'production';
  const cspHeader = generateCSPHeader(isDevelopment);

  fastify.addHook('onSend', async (request, reply, payload) => {
    // Set CSP header
    reply.header('Content-Security-Policy', cspHeader);
    
    // Additional security headers
    reply.header('X-Content-Type-Options', 'nosniff');
    reply.header('X-Frame-Options', 'DENY');
    reply.header('X-XSS-Protection', '1; mode=block');
    reply.header('Referrer-Policy', 'strict-origin-when-cross-origin');
    // Note: Permissions-Policy removed to avoid interfering with audio features
    
    return payload;
  });

  done();
}

export default { generateCSPHeader, cspPlugin };
