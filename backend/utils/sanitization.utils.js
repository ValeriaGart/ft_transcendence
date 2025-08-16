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
 * Sanitizes and validates URLs to prevent XSS attacks
 * @param {string|null|undefined} url - The URL to sanitize
 * @returns {string} Sanitized URL or empty string if invalid
 */
export function sanitizeUrl(url) {
  if (!url || typeof url !== 'string') {
    return '';
  }
  
  const trimmedUrl = url.trim();
  
  // Reject dangerous protocols
  const dangerousProtocols = [
    'javascript:',
    'data:',
    'vbscript:',
    'file:',
    'about:',
    'chrome:',
    'chrome-extension:',
    'moz-extension:'
  ];
  
  const lowerUrl = trimmedUrl.toLowerCase();
  for (const protocol of dangerousProtocols) {
    if (lowerUrl.startsWith(protocol)) {
      return '';
    }
  }
  
  // Allow only http, https, and relative URLs
  if (trimmedUrl.startsWith('//') || 
      trimmedUrl.startsWith('http://') || 
      trimmedUrl.startsWith('https://') ||
      trimmedUrl.startsWith('/') ||
      (!trimmedUrl.includes(':') && !trimmedUrl.startsWith('//'))) {
    
    // Additional validation: check for encoded dangerous protocols
    const decoded = decodeURIComponent(trimmedUrl);
    const decodedLower = decoded.toLowerCase();
    
    for (const protocol of dangerousProtocols) {
      if (decodedLower.includes(protocol)) {
        return '';
      }
    }
    
    // Sanitize the URL to prevent HTML injection
    return escapeHtml(trimmedUrl);
  }
  
  // If none of the allowed patterns match, return empty string
  return '';
}