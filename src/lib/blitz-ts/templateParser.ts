/**
 * Escapes HTML special characters to prevent XSS attacks
 * @param {string} unsafe - The potentially unsafe string
 * @returns {string} HTML-escaped string safe for insertion into DOM
 */
function escapeHtml(unsafe: string | null | undefined): string {
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
 * Parses a template string and replaces variables and control structures with their values
 * Supports:
 * - Variable interpolation using {{variable}} syntax (HTML-safe by default)
 * - Raw HTML interpolation using {{{variable}}} syntax (unsafe, use with caution)
 * - For loops using blitz-for directive
 * - Conditional rendering using blitz-if and blitz-else directives
 * - Nested property access using dot notation
 * - Child content insertion using blitz-slot element
 * 
 * @param template - The template string to parse
 * @param state - The state object containing values to interpolate
 * @returns The processed template with all variables and control structures resolved
 */
export function parseTemplate(template: string, state: Record<string, any>): string {
  // First handle for loops
  let processedTemplate = template;
  const forRegex = /<([^>]+)\s+blitz-for="([^"]+)"([^>]*)>([\s\S]*?)<\/\1>/g;
  
  processedTemplate = processedTemplate.replace(forRegex, (_, tagName, expression, rest, content) => {
    // Parse the for expression (e.g. "item in items" or "(item, index) in items")
    const parts = expression.trim().split(/\s+in\s+/);
    if (parts.length !== 2) {
      console.warn(`Invalid blitz-for expression: ${expression}. Expected format: "item in items" or "(item, index) in items"`);
      return '';
    }

    const [itemPart, collectionName] = parts;
    if (!collectionName) {
      console.warn(`Missing collection name in blitz-for expression: ${expression}`);
      return '';
    }

    // Resolve the collection from state using dot notation
    const collection = collectionName.split('.').reduce((obj: any, prop: string) => obj?.[prop], state);
    
    if (!Array.isArray(collection)) {
      console.warn(`Collection ${collectionName} is not an array`);
      return '';
    }

    // Parse item and index names from the expression
    const itemMatch = itemPart.match(/^\(([^,]+)(?:,\s*([^)]+))?\)$/) || [null, itemPart];
    const itemName = itemMatch[1].trim();
    const indexName = itemMatch[2]?.trim();

    // Generate the repeated content for each item in the collection
    return collection.map((item: any, index: number) => {
      let repeatedContent = content;
      
      // Replace item property references (e.g. {{item.name}}) with HTML escaping
      repeatedContent = repeatedContent.replace(new RegExp(`{{${itemName}\\.([^}]+)}}`, 'g'), (_: string, prop: string) => {
        return item[prop] !== undefined ? escapeHtml(String(item[prop])) : '';
      });
      
      // Replace direct item references (e.g. {{item}}) with HTML escaping
      repeatedContent = repeatedContent.replace(new RegExp(`{{${itemName}}}`, 'g'), escapeHtml(String(item)));
      
      // Replace index references if index name is provided (numbers are safe, no escaping needed)
      if (indexName) {
        repeatedContent = repeatedContent.replace(new RegExp(`{{${indexName}}}`, 'g'), String(index));
      }

      return `<${tagName}${rest}>${repeatedContent}</${tagName}>`;
    }).join('');
  });

  // Then handle conditional rendering with else support
  let result = '';
  let buffer = '';
  let currentCondition: boolean | null = null;
  let skipContent = false;

  // Split the template into parts: tags and text
  const parts = processedTemplate.split(/(<[^>]+>)/);
  
  for (const part of parts) {
    if (part.startsWith('<')) {
      // This is a tag
      const match = part.match(/<([^>]+)\s+(?:blitz-if="([^"]+)"|blitz-else)([^>]*)>|<(\/[^>]+)>|<([^>]+)>/);
      
      if (match) {
        const [, _tagName, condition, _rest, closingTag, normalTag] = match;

        if (closingTag) {
          if (!skipContent) {
            if (buffer) {
              result += buffer;
              buffer = '';
            }
            result += part;
          }
          continue;
        }

        if (normalTag) {
          if (!skipContent) {
            if (buffer) {
              result += buffer;
              buffer = '';
            }
            result += part;
          }
          continue;
        }

        // Handle conditional tags (blitz-if and blitz-else)
        if (condition) {
          // This is a blitz-if
          const trimmedCondition = condition.trim();
          const value = state[trimmedCondition];
          currentCondition = Boolean(value);
          skipContent = !currentCondition;
          
          if (!skipContent) {
            if (buffer) {
              result += buffer;
              buffer = '';
            }
            result += part;
          }
        } else {
          // This is a blitz-else
          if (currentCondition === null) {
            console.warn('blitz-else used without a preceding blitz-if');
            if (buffer) {
              result += buffer;
              buffer = '';
            }
            result += part;
          } else {
            skipContent = currentCondition;
            if (!skipContent) {
              if (buffer) {
                result += buffer;
                buffer = '';
              }
              result += part;
            }
            currentCondition = null; // Reset for next if-else chain
          }
        }
      } else {
        if (!skipContent) {
          if (buffer) {
            result += buffer;
            buffer = '';
          }
          result += part;
        }
      }
    } else if (!skipContent) {
      // This is text content, only add if we're not skipping
      buffer += part;
    }
  }

  // Add any remaining buffer content
  if (buffer && !skipContent) {
    result += buffer;
  }

  // Finally handle template variables with HTML escaping
  // Support both {{variable}} (HTML-safe) and {{{variable}}} (raw HTML)
  
  // First handle raw HTML variables {{{variable}}} (unsafe - use with caution)
  result = result.replace(/\{\{\{([^}]+)\}\}\}/g, (_, key) => {
    const trimmedKey = key.trim();
    const value = trimmedKey.split('.').reduce((obj: any, prop: string) => obj?.[prop], state);
    return value !== undefined ? String(value) : '';
  });
  
  // Then handle HTML-safe variables {{variable}} (safe by default)
  result = result.replace(/\{\{([^}]+)\}\}/g, (_, key) => {
    const trimmedKey = key.trim();
    const value = trimmedKey.split('.').reduce((obj: any, prop: string) => obj?.[prop], state);
    return value !== undefined ? escapeHtml(String(value)) : '';
  });

  // Ensure blitz-slot elements are preserved
  result = result.replace(/<blitz-slot\s*\/?>/g, '<blitz-slot></blitz-slot>');

  return result;
} 