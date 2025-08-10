/**
 * HTML Sanitization utilities to prevent XSS attacks
 */

/**
 * Escapes HTML special characters to prevent XSS attacks
 * @param unsafe - The potentially unsafe string
 * @returns HTML-escaped string safe for insertion into DOM
 */
export function escapeHtml(unsafe: string | null | undefined): string {
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
 * Sanitizes user input for safe display in templates
 * @param value - The value to sanitize
 * @returns Sanitized string safe for HTML insertion
 */
export function sanitizeForTemplate(value: any): string {
  if (value === null || value === undefined) {
    return '';
  }
  
  return escapeHtml(String(value));
}

/**
 * Creates a text node safely (alternative to innerHTML)
 * @param text - The text content
 * @returns Text node safe for DOM insertion
 */
export function createSafeTextNode(text: string): Text {
  return document.createTextNode(text || '');
}

/**
 * Sets text content safely on an element
 * @param element - The DOM element
 * @param text - The text to set
 */
export function setSafeTextContent(element: HTMLElement | null, text: string): void {
  if (element) {
    element.textContent = text || '';
  }
}

/**
 * Sanitizes attributes for safe HTML insertion
 * @param value - The attribute value
 * @returns Sanitized attribute value
 */
export function sanitizeAttribute(value: string | null | undefined): string {
  if (value === null || value === undefined) {
    return '';
  }
  
  return String(value)
    .replace(/[<>"'&]/g, (char) => {
      switch (char) {
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '"': return '&quot;';
        case "'": return '&#x27;';
        case '&': return '&amp;';
        default: return char;
      }
    });
}
