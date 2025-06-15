/**
 * Represents a route in the application
 */
export interface Route {
  /** The URL path pattern for this route */
  path: string;
  /** The component constructor to render for this route */
  component: new (params?: Record<string, string>) => { mount: (element: HTMLElement) => void };
  /** Optional child routes for nested routing */
  children?: Route[];
}

/**
 * Singleton router class that handles client-side routing
 * 
 * Features:
 * - Path parameter support (e.g. /users/:id)
 * - Nested routes
 * - Browser history integration
 * - Route parameter passing to components
 * 
 * Example usage:
 * ```typescript
 * const router = Router.getInstance(rootElement);
 * router
 *   .addRoute({ path: '/', component: HomeComponent })
 *   .addRoute({ 
 *     path: '/users/:id', 
 *     component: UserComponent,
 *     children: [
 *       { path: 'profile', component: UserProfileComponent }
 *     ]
 *   })
 *   .init();
 * ```
 */
export class Router {
  private static instance: Router;
  private routes: Route[] = [];
  private currentRoute: Route | null = null;
  private currentParams: Record<string, string> = {};
  private rootElement: HTMLElement;
  private initialized: boolean = false;

  /**
   * Private constructor to enforce singleton pattern
   * @param rootElement - The DOM element where components will be mounted
   */
  private constructor(rootElement: HTMLElement) {
    this.rootElement = rootElement;
  }

  /**
   * Gets the singleton router instance
   * @param rootElement - The root element for mounting components (required for first call)
   * @returns The router instance
   */
  public static getInstance(rootElement?: HTMLElement): Router {
    if (!Router.instance && rootElement) {
      Router.instance = new Router(rootElement);
    }
    return Router.instance;
  }

  /**
   * Adds a route to the router
   * @param route - The route configuration to add
   * @returns The router instance for chaining
   */
  public addRoute(route: Route): this {
    this.routes.push(route);
    return this;
  }

  /**
   * Initializes the router
   * Sets up history listeners and handles the initial route
   */
  public init(): void {
    if (this.initialized) return;
    
    // Handle browser back/forward buttons
    window.addEventListener('popstate', () => {
      this.handleRoute(window.location.pathname);
    });

    // Handle initial route
    this.handleRoute(window.location.pathname);
    this.initialized = true;
  }

  /**
   * Navigates to a new route
   * Updates the browser history and renders the new route
   * @param path - The path to navigate to
   */
  public navigate(path: string): void {
    window.history.pushState({}, '', path);
    this.handleRoute(path);
  }

  /**
   * Finds a matching route for a given path
   * Handles both exact matches and nested routes
   * 
   * @param path - The path to match
   * @param routes - The routes to search through
   * @returns The matched route and its parameters
   */
  private findRoute(path: string, routes: Route[]): { route: Route | null; params: Record<string, string> } {
    
    for (const route of routes) {
      
      // Convert route paths to regex patterns and capture parameter names
      const paramNames: string[] = [];
      const pattern = route.path.replace(/:\w+/g, (match) => {
        paramNames.push(match.slice(1));
        return '([^/]+)';
      });
      
      // First check if this route matches exactly
      const exactRegex = new RegExp(`^${pattern}$`);
      const exactMatch = path.match(exactRegex);
      
      if (exactMatch) {
        // Extract parameters
        const params: Record<string, string> = {};
        paramNames.forEach((name, index) => {
          params[name] = exactMatch[index + 1];
        });
        return { route, params };
      }

      // Then check for nested routes
      if (route.children) {
        // For parent routes, we need to match the prefix
        const prefixRegex = new RegExp(`^${pattern}`);
        const prefixMatch = path.match(prefixRegex);
        
        if (prefixMatch) {
          // For root route, we need to handle the remaining path differently
          const remainingPath = route.path === '/' ? path : path.slice(prefixMatch[0].length);
          
          // If there's no remaining path and this is a parent route, return it
          if (!remainingPath && route.path !== '/') {
            return { route, params: {} };
          }
          
          // Check child routes
          for (const childRoute of route.children) {
            // For child routes, we need to match the full remaining path
            const childParamNames: string[] = [];
            const childPattern = childRoute.path.replace(/:\w+/g, (match) => {
              childParamNames.push(match.slice(1));
              return '([^/]+)';
            });
            
            const childRegex = new RegExp(`^${childPattern}$`);
            const childMatch = remainingPath.match(childRegex);
            
            if (childMatch) {
              // Extract parameters from both parent and child routes
              const params: Record<string, string> = {};
              
              // Add parent route parameters
              paramNames.forEach((name, index) => {
                params[name] = prefixMatch[index + 1];
              });
              
              // Add child route parameters
              childParamNames.forEach((name, index) => {
                params[name] = childMatch[index + 1];
              });
              
              return { route: childRoute, params };
            }
          }
        }
      }
    }
    return { route: null, params: {} };
  }

  /**
   * Handles a route change
   * Updates the current route and renders the new component
   * @param path - The path to handle
   */
  private handleRoute(path: string): void {
    const { route, params } = this.findRoute(path, this.routes);

    if (route) {
      this.currentRoute = route;
      this.currentParams = params;
      this.render();
    } else {
      // Handle 404
      console.error(`No route found for path: ${path}`);
    }
  }

  /**
   * Renders the current route's component
   * Clears the root element and mounts the new component
   */
  private render(): void {
    if (this.currentRoute) {
      // Clear the root element
      this.rootElement.innerHTML = '';
      
      // Create and mount the component with parameters
      const component = new this.currentRoute.component(this.currentParams);
      component.mount(this.rootElement);
    }
  }
}

/**
 * Navigation utility object for common navigation actions
 */
export const navigation = {
  /**
   * Navigate to a specific path
   * @param path - The path to navigate to
   */
  navigate: (path: string) => Router.getInstance().navigate(path),
  
  /**
   * Navigate to the home page
   */
  goToHome: () => Router.getInstance().navigate('/'),
  
  /**
   * Navigate to the about page
   */
  goToAbout: () => Router.getInstance().navigate('/about'),
}; 