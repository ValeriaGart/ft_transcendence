import type { Plugin } from 'vite'

export function htmlTemplatePlugin(): Plugin {
  return {
    name: 'html-template',
    transform(code, id) {
      // Only process .html files
      if (!id.endsWith('.html')) {
        return null
      }

      // Convert the HTML content to a string export
      return {
        code: `export default ${JSON.stringify(code)}`,
        map: null
      }
    }
  }
} 