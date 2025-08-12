import { Component } from "@blitz-ts/Component";
import { Router } from "@blitz-ts/router";
import { authService } from "../../lib/auth";
import type { AuthState } from "../../lib/auth";
import { UserPage } from "../UserPage";
import { SettingsPage } from "../SettingsPage";
import { GamePage } from "../GamePage";
import { ViewPage } from "../ViewPage";

interface ProtectedRouteProps {
  children?: HTMLElement[];
  currentPath?: string;
}

interface ProtectedRouteState {
  isAuthenticated: boolean;
  isLoading: boolean;
  showLoading: boolean;
  showUnauthenticated: boolean;
  showAuthenticated: boolean;
}

export class ProtectedRoute extends Component<ProtectedRouteProps, ProtectedRouteState> {
  protected static state: ProtectedRouteState = {
    isAuthenticated: false,
    isLoading: true,
    showLoading: true,
    showUnauthenticated: false,
    showAuthenticated: false,
  };

  // Singleton instance to prevent multiple instances
  private static isMounted: boolean = false;

  private unsubscribe: (() => void) | null = null;
  private userPageComponent: UserPage | null = null;
  private settingsPageComponent: SettingsPage | null = null;
  private isUserPageMounted: boolean = false;
  private hasRendered: boolean = false; // Track if we've already rendered
  private retryCount: number = 0; // Track retry attempts
  private hasRenderedCurrentPage: string = ""; // Track if we've already rendered the current page
  private viewPageComponent: ViewPage | null = null;

  constructor(props?: ProtectedRouteProps) {
    super(props || { children: [] });
    console.log('ProtectedRoute constructor called with props:', props);
    
    // Mark state properties as structural so they trigger re-renders
    this.markStructural('isAuthenticated', 'isLoading', 'showLoading', 'showUnauthenticated', 'showAuthenticated');
    
  }

  protected async onMount(): Promise<void> {
    console.log('ProtectedRoute onMount called, isMounted:', ProtectedRoute.isMounted);
    
    // Reset the static flag when component is remounted
    if (ProtectedRoute.isMounted) {
      console.log('ProtectedRoute already mounted, resetting for remount');
      ProtectedRoute.isMounted = false;
    }
    
    ProtectedRoute.isMounted = true;
    
    // Reset component state for remount
    this.hasRendered = false;
    this.hasRenderedCurrentPage = "";
    this.isUserPageMounted = false;
    this.retryCount = 0;
    
    const currentAuthState = authService.getAuthState(); 
    this.updateStateWithComputed(currentAuthState.isAuthenticated, false);

    this.unsubscribe = authService.subscribe((authState: AuthState) => {
      this.updateStateWithComputed(authState.isAuthenticated, false);

      // If not authenticated, redirect to login
      if (!authState.isAuthenticated && !this.state.isLoading) {
        Router.getInstance().navigate('/signin');
      } else if (authState.isAuthenticated) {
        this.renderCurrentPage();
      }
    });
  }

  private updateStateWithComputed(isAuthenticated: boolean, isLoading: boolean): void {
    this.setState({
      isAuthenticated,
      isLoading,
      showLoading: isLoading,
      showUnauthenticated: !isLoading && !isAuthenticated,
      showAuthenticated: !isLoading && isAuthenticated,
    });
  }

  // Method to reset component state (call this when user changes)
  public resetComponent(): void {
    console.log('ProtectedRoute: Resetting component state');
    this.hasRendered = false;
    this.hasRenderedCurrentPage = "";
    this.isUserPageMounted = false;
    this.retryCount = 0;
    
    // Clear existing components
    if (this.userPageComponent) {
      this.userPageComponent.unmount();
      this.userPageComponent = null;
    }
    if (this.settingsPageComponent) {
      this.settingsPageComponent.unmount();
      this.settingsPageComponent = null;
    }
    if (this.viewPageComponent) {
      this.viewPageComponent.unmount();
      this.viewPageComponent = null;
    }
  }

  private renderCurrentPage(): void {
    // Use the currentPath from props if available, otherwise fall back to window.location.pathname
    const currentPath = this.props.currentPath || window.location.pathname;
    console.log('ProtectedRoute: renderCurrentPage called for path:', currentPath);
    console.log('ProtectedRoute: props.currentPath:', this.props.currentPath);
    console.log('ProtectedRoute: window.location.pathname:', window.location.pathname);
    
    // Prevent multiple calls to renderCurrentPage
    if (this.hasRenderedCurrentPage === currentPath) {
      console.log('ProtectedRoute: Already rendered current page, skipping');
      return;
    }
    
    this.hasRenderedCurrentPage = currentPath;
    
    if (currentPath === '/user/settings') {
      console.log('ProtectedRoute: Rendering SettingsPage');
      this.renderSettingsPage();
    } else if (currentPath === '/user/game') {
      console.log('ProtectedRoute: Rendering GamePage');
      this.renderGamePage();
    } else if (currentPath.startsWith('/user/')) {
      console.log('ProtectedRoute: Rendering ViewPage');
      const rawNick = currentPath.split('/')[2] || '';
      const nickname = decodeURIComponent(rawNick);
      this.renderViewPage(nickname);
    } else {
      console.log('ProtectedRoute: Rendering UserPage');
      this.renderUserPage();
    }
  }

  private renderUserPage(): void {
    console.log('ProtectedRoute: renderUserPage called');
    const slot = this.element.querySelector('blitz-slot');
    console.log('ProtectedRoute: Found slot:', slot);
    
    if (slot) {
      // Only clear and remount if not already mounted
      if (!this.isUserPageMounted) {
        slot.innerHTML = '';
        console.log('ProtectedRoute: Clearing slot and mounting UserPage');
        
        // Create and mount UserPage component
        if (!this.userPageComponent) {
          console.log('ProtectedRoute: Creating new UserPage component');
          this.userPageComponent = new UserPage();
        } else {
          console.log('ProtectedRoute: Reusing existing UserPage component');
        }

        // Mount the UserPage component to the slot
        console.log('ProtectedRoute: Mounting UserPage component');
        this.userPageComponent.mount(slot as HTMLElement);
        this.isUserPageMounted = true;
      } else {
        console.log('ProtectedRoute: UserPage already mounted, skipping remount');
      }
    } else {
      this.retryCount++;
      console.error(`ProtectedRoute: No slot found for UserPage, retry ${this.retryCount}/5`);
      
      // Only retry up to 5 times
      if (this.retryCount < 5) {
        setTimeout(() => {
          // Only retry if we're still authenticated and not loading
          if (this.state.showAuthenticated) {
            this.renderUserPage();
          }
        }, 50);
      } else {
        console.error('ProtectedRoute: Max retries reached, giving up on finding slot');
      }
    }
  }

  private renderSettingsPage(): void {
    console.log('ProtectedRoute: renderSettingsPage called');
    const slot = this.element.querySelector('blitz-slot');
    if (slot) {
      slot.innerHTML = '';
    }

    // Create and mount SettingsPage component
    if (!this.settingsPageComponent) {
      console.log('ProtectedRoute: Creating new SettingsPage component');
      this.settingsPageComponent = new SettingsPage();
    } else {
      console.log('ProtectedRoute: Reusing existing SettingsPage component');
    }

    // Mount the SettingsPage component to the slot
    if (slot) {
      console.log('ProtectedRoute: Mounting SettingsPage component');
      this.settingsPageComponent.mount(slot as HTMLElement);
    } else {
      console.error('ProtectedRoute: No slot found for SettingsPage');
    }
  }

  private renderGamePage(): void {
    console.log('ProtectedRoute: renderGamePage called');
    const slot = this.element.querySelector('blitz-slot');
    if (slot) {
      slot.innerHTML = '';
    }

    // Create and mount GamePage component
    console.log('ProtectedRoute: Creating new GamePage component');
    const gamePageComponent = new GamePage();

    // Mount the GamePage component to the slot
    if (slot) {
      console.log('ProtectedRoute: Mounting GamePage component');
      gamePageComponent.mount(slot as HTMLElement);
    } else {
      console.error('ProtectedRoute: No slot found for GamePage');
    }
  }

  private renderViewPage(nickname: string): void {
    console.log('ProtectedRoute: renderViewPage called with', nickname);
    const slot = this.element.querySelector('blitz-slot');
    if (slot) {
      slot.innerHTML = '';
    }

    if (!this.viewPageComponent) {
      this.viewPageComponent = new ViewPage({ nickname });
    } else {
      this.viewPageComponent.setProps({ nickname });
    }

    if (slot) {
      this.viewPageComponent.mount(slot as HTMLElement);
    }
  }

  protected onUnmount(): void {
    console.log('ProtectedRoute onUnmount called');
    ProtectedRoute.isMounted = false;
    this.hasRendered = false;
    this.hasRenderedCurrentPage = ""; // Reset the flag
    this.retryCount = 0; // Reset retry count
    this.isUserPageMounted = false; // Reset mounted flag
    
    if (this.unsubscribe) {
      this.unsubscribe();
    }
    if (this.userPageComponent) {
      this.userPageComponent.unmount();
    }
    if (this.settingsPageComponent) {
      this.settingsPageComponent.unmount();
    }
  }

  protected setState(newState: Partial<ProtectedRouteState>): void {
    // Only update state if values actually changed
    const hasChanges = Object.keys(newState).some(key => 
      this.state[key as keyof ProtectedRouteState] !== newState[key as keyof ProtectedRouteState]
    );
    
    if (!hasChanges) {
      return; // No changes, don't trigger re-render
    }
    
    super.setState(newState);
  }

  render() {
    console.log('ProtectedRoute: render called');
    console.log('ProtectedRoute: state:', this.state);
    console.log('ProtectedRoute: props:', this.props);
    
    // The template handles all conditional rendering now
    // Just trigger renderCurrentPage when authenticated and not loading
    if (this.state.showAuthenticated && !this.hasRendered) {
      console.log('ProtectedRoute: Setting up authenticated state');
      this.hasRendered = true;
      
      // Use requestAnimationFrame to ensure DOM is updated before trying to find slot
      requestAnimationFrame(() => {
        console.log('ProtectedRoute: Calling renderCurrentPage from render');
        this.renderCurrentPage();
      });
    } else if (this.state.showAuthenticated && this.hasRendered && this.props.currentPath) {
      // If we're already rendered but the path has changed, re-render the current page
      console.log('ProtectedRoute: Path changed, re-rendering current page');
      this.renderCurrentPage();
    }
  }
} 