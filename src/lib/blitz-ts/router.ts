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
  private componentCache: Map<string, any> = new Map();
  private isNavigating: boolean = false;

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
      // Prevent unwanted navigation if we're in the middle of navigating
      if (this.isNavigating) {
        console.log('Router: Navigation in progress, ignoring popstate');
        return;
      }
      

      
      // Check if this is a legitimate back button navigation
      // If we're going from /game to /user, this is likely a legitimate back button press
      if (window.location.pathname === '/user' && this.currentRoute?.path === '/game') {
        console.log('Router: Back button pressed from game to user, allowing navigation');
        // Allow the navigation to proceed
      }
      
      this.handleRoute(window.location.pathname + window.location.search);
    });

    // Handle initial route
    this.handleRoute(window.location.pathname + window.location.search);
    this.initialized = true;
  }

  /**
   * Navigates to a new route
   * Updates the browser history and renders the new route
   * @param path - The path to navigate to
   */
  public navigate(path: string): void {
    
    this.isNavigating = true;
    window.history.pushState({}, '', path);
    this.handleRoute(path);
    
    // Delay clearing the navigation flag to prevent popstate interference
    setTimeout(() => {
      this.isNavigating = false;
      console.log('Router: Navigation flag cleared');
    }, 100);
  }

  /**
   * Clears the component cache
   * Useful when navigating to a completely different route type
   */
  public clearCache(): void {
    this.componentCache.clear();
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
            console.log('Router: No remaining path, checking for empty child route');
            // Check if there's a child route with empty path
            const emptyChildRoute = route.children?.find(child => child.path === '');
            if (emptyChildRoute) {
              console.log('Router: Found empty child route, returning it');
              return { route: emptyChildRoute, params: {} };
            }
            console.log('Router: No empty child route found, returning parent route');
            return { route, params: {} };
          }
          
          // Check child routes
          for (const childRoute of route.children) {
            console.log('Router: Checking child route:', childRoute.path, 'against remaining path:', remainingPath);
            
            // For child routes, we need to match the full remaining path
            const childParamNames: string[] = [];
            const childPattern = childRoute.path.replace(/:\w+/g, (match) => {
              childParamNames.push(match.slice(1));
              return '([^/]+)';
            });
            
            const childRegex = new RegExp(`^${childPattern}$`);
            const childMatch = remainingPath.match(childRegex);
            
            console.log('Router: Child route pattern:', childPattern, 'match:', childMatch);
            
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
              
              console.log('Router: Found matching child route:', childRoute.path);
              console.log('Router: But returning parent route for nested rendering');
              // Add the current path to params so the parent component knows which child to render
              params.currentPath = path;
              console.log('Router: Added currentPath to params:', params);
              return { route: route, params }; // Return parent route, not child route
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
    console.log('Router: Handling route for path:', path);
    
    // Strip query parameters from the path for route matching
    const pathWithoutQuery = path.split('?')[0];
    console.log('Router: Path without query parameters:', pathWithoutQuery);
    
    const { route, params } = this.findRoute(pathWithoutQuery, this.routes);

    if (route) {
      // Check authentication status
      const isAuthenticated = this.checkAuthenticationStatus();
      
      // Define routes that should redirect authenticated users to /user
      const authenticatedUserRedirectRoutes = ['/auth', '/signup', '/signin', '/greatsuccess'];
      
      // If user is authenticated and trying to access a redirect route, redirect to /user
      if (isAuthenticated && authenticatedUserRedirectRoutes.includes(pathWithoutQuery)) {
        this.navigate('/user');
        return;
      }
      
      // Clear cache if navigating to a different route type
      if (this.currentRoute && this.currentRoute.component !== route.component) {
        console.log('Router: Different route type detected, clearing cache');
        this.clearCache();
      }
      
      this.currentRoute = route;
      this.currentParams = params;
      this.render();
    } else {
      // Handle 404
      console.error(`No route found for path: ${pathWithoutQuery}`);
    }
  }

  /**
   * Checks if the user is currently authenticated
   * @returns true if authenticated, false otherwise
   */
  private checkAuthenticationStatus(): boolean {
    try {
      const token = localStorage.getItem('auth_token');
      const user = localStorage.getItem('auth_user');
      const isAuthenticated = !!(token && user);
      
      return isAuthenticated;
    } catch (error) {
      console.error('Error checking authentication status:', error);
      return false;
    }
  }

  /**
   * Renders the current route's component
   * Clears the root element and mounts the new component
   */
  private render(): void {
    if (this.currentRoute) {
      console.log('Router: Rendering component:', this.currentRoute.component.name);
      
      // Clear the root element
      this.rootElement.innerHTML = '';
      
      // Check if this is a child route that needs to be rendered through its parent
      // OR if this is a parent route with children that needs to handle child routing
      const parentRoute = this.findParentRoute(this.currentRoute);
      const isParentRouteWithChildren = this.currentRoute.children && this.currentParams.currentPath;
      const isChildRoute = parentRoute && parentRoute.children;
      
      if (isChildRoute || isParentRouteWithChildren) {
        console.log('Router: This is a route that needs parent handling');
        console.log('Router: Current route:', this.currentRoute.path);
        
        // For child routes, we should render the parent route and let it handle the child
        // The parent route will determine which child to render based on the current path
        const routeToRender = parentRoute || this.currentRoute;
        const cacheKey = `parent_${routeToRender.component.name}`;
        let parentComponent = this.componentCache.get(cacheKey);
        
        if (!parentComponent) {
          parentComponent = new routeToRender.component(this.currentParams);
          this.componentCache.set(cacheKey, parentComponent);
          console.log('Router: Created new parent component:', parentComponent);
          console.log('Router: Parent component params:', this.currentParams);
          // Mount the parent component
          parentComponent.mount(this.rootElement);
          console.log('Router: Parent component mounted');
        } else {
          console.log('Router: Reusing cached parent component:', parentComponent);
          // Check if the parameters have changed
          const currentProps = parentComponent.props || {};
          const hasParamChanges = Object.keys(this.currentParams).some(key => 
            currentProps[key] !== this.currentParams[key]
          );
          
          if (hasParamChanges) {
            console.log('Router: Parameters changed, clearing cache and creating new component');
            this.componentCache.delete(cacheKey);
            parentComponent = new routeToRender.component(this.currentParams);
            this.componentCache.set(cacheKey, parentComponent);
            console.log('Router: Created new parent component with updated params:', this.currentParams);
          } else {
            console.log('Router: No parameter changes, reusing cached component');
          }
          
          // Mount the component
          parentComponent.mount(this.rootElement);
          console.log('Router: Parent component mounted');
        }
      } else {
        // Create and mount the component with parameters
        const cacheKey = `component_${this.currentRoute.component.name}`;
        let component = this.componentCache.get(cacheKey);
        
        if (!component) {
          component = new this.currentRoute.component(this.currentParams);
          this.componentCache.set(cacheKey, component);
          console.log('Router: Created new component instance:', component);
          component.mount(this.rootElement);
          console.log('Router: Component mounted successfully');
        } else {
          console.log('Router: Reusing cached component instance:', component);
          // Update the cached component with new parameters
          if (component.props) {
            component.props = { ...component.props, ...this.currentParams };
          }
          component.mount(this.rootElement);
          console.log('Router: Cached component remounted with updated params');
        }
      }
    }
  }

  /**
   * Finds the parent route for a given child route
   */
  private findParentRoute(childRoute: Route): Route | null {
    for (const route of this.routes) {
      if (route.children) {
        for (const child of route.children) {
          if (child === childRoute) {
            return route;
          }
        }
      }
    }
    return null;
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