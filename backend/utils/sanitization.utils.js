/**
 * Backend sanitization utilities to prevent XSS attacks
 */

/**
 * Escapes HTML special characters to prevent XSS attacks
 * @param {string|null|undefined} unsafe - The potentially unsafe string
 * @returns {string} HTML-escaped string safe for insertion into DOM
 */
export function escapeHtml(unsafe) {
  if (unsafe === null || unsafe === undefined) {
    return '';
  }
  
  return String(unsafe)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Sanitizes user input for safe database storage and API responses
 * @param {any} value - The value to sanitize
 * @returns {string} Sanitized string
 */
export function sanitizeInput(value) {
  if (value === null || value === undefined) {
    return '';
  }
  
  return escapeHtml(String(value));
}

/**
 * Sanitizes an object's string properties
 * @param {Object} obj - Object to sanitize
 * @param {Array<string>} fields - Fields to sanitize
 * @returns {Object} Object with sanitized fields
 */
export function sanitizeObject(obj, fields) {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }
  
  const sanitized = { ...obj };
  
  for (const field of fields) {
    if (sanitized[field] !== undefined && sanitized[field] !== null) {
      sanitized[field] = sanitizeInput(sanitized[field]);
    }
  }
  
  return sanitized;
}

/**
 * Sanitizes WebSocket message data
 * @param {Object} message - WebSocket message to sanitize
 * @returns {Object} Sanitized message
 */
export function sanitizeWebSocketMessage(message) {
  if (!message || typeof message !== 'object') {
    return message;
  }
  
  const sanitized = { ...message };
  
  // Common fields that need sanitization in WebSocket messages
  const fieldsToSanitize = ['nick', 'message', 'roomId', 'gameMode', 'oppMode'];
  
  return sanitizeObject(sanitized, fieldsToSanitize);
}
