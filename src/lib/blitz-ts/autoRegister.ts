import { Component } from './Component';
import { registerComponent } from './componentRegistry';

/**
 * Type definition for component modules
 * Components can be exported as default or named exports
 */
interface ComponentModule {
  [key: string]: any;
}

/**
 * Automatically registers all components from the components directory
 * 
 * This utility scans the components directory for component modules and registers them
 * as custom elements. Components should be organized as follows:
 * 
 * ```
 * components/
 *   Button/
 *     index.ts      # Exports the Button component
 *     template.html # Component template
 *   Card/
 *     index.ts      # Exports the Card component
 *     template.html # Component template
 * ```
 * 
 * The component name will be converted to kebab-case and prefixed with 'blitz-'
 * For example:
 * - Button component becomes 'blitz-button'
 * - UserProfile component becomes 'blitz-user-profile'
 * 
 * Components must:
 * 1. Be in their own directory
 * 2. Have an index.ts file that exports the component class
 * 3. Extend the base Component class
 * 
 * @returns A promise that resolves when all components are registered
 */
export async function autoRegisterComponents() {
  // Get all component directories using Vite's glob import
  const componentModules = import.meta.glob('/src/components/*/index.ts', { eager: true });
  
  for (const [path, module] of Object.entries(componentModules)) {
    const componentModule = module as ComponentModule;
    
    // Extract component name from the directory path
    const componentName = path.split('/').slice(-2, -1)[0];
    
    // Convert component name to kebab-case and add 'blitz-' prefix
    const tagName = `blitz-${componentName
      .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
      .toLowerCase()}`;
    
    // Get the component class from the module
    // Try default export first, then fall back to named export matching directory name
    const ComponentClass = componentModule.default || componentModule[componentName];
    
    if (ComponentClass && ComponentClass.prototype instanceof Component) {
      // Only register if it's a valid component class
      registerComponent(tagName, ComponentClass);
      console.log(`Registered component: ${tagName}`);
    } else {
      console.warn(`Skipping ${componentName} as it's not a valid component class`);
    }
  }
} 