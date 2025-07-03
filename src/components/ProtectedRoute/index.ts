import { Component } from "@blitz-ts/Component";
import { Router } from "@blitz-ts/router";
import { authService } from "../../lib/auth";
import type { AuthState } from "../../lib/auth";
import { UserPage } from "../UserPage";
import { SettingsPage } from "../SettingsPage";

interface ProtectedRouteProps {
  children?: HTMLElement[];
}

interface ProtectedRouteState {
  isAuthenticated: boolean;
  isLoading: boolean;
}

export class ProtectedRoute extends Component<ProtectedRouteProps, ProtectedRouteState> {
  protected static state: ProtectedRouteState = {
    isAuthenticated: false,
    isLoading: true,
  };

  private unsubscribe: (() => void) | null = null;
  private userPageComponent: UserPage | null = null;
  private settingsPageComponent: SettingsPage | null = null;

  constructor(props?: ProtectedRouteProps) {
    super(props || { children: [] });
    console.log('ProtectedRoute constructor called with props:', props);
  }

  protected async onMount(): Promise<void> {
  
    const currentAuthState = authService.getAuthState(); 
    this.setState({
      isAuthenticated: currentAuthState.isAuthenticated,
      isLoading: false,
    });

    this.unsubscribe = authService.subscribe((authState: AuthState) => {
      this.setState({
        isAuthenticated: authState.isAuthenticated,
        isLoading: false,
      });

      // If not authenticated, redirect to login
      if (!authState.isAuthenticated && !this.state.isLoading) {
        Router.getInstance().navigate('/signin');
      } else if (authState.isAuthenticated) {
        this.renderCurrentPage();
      }
    });
  }

  private renderCurrentPage(): void {
    const currentPath = window.location.pathname;
    
    if (currentPath === '/user/settings') {
      this.renderSettingsPage();
    } else {
      this.renderUserPage();
    }
  }

  private renderUserPage(): void {
    const slot = this.element.querySelector('blitz-slot');
    if (slot) {
      slot.innerHTML = '';
    }

    // Create and mount UserPage component
    if (!this.userPageComponent) {
      this.userPageComponent = new UserPage();
    }

    // Mount the UserPage component to the slot
    if (slot) {
      this.userPageComponent.mount(slot as HTMLElement);
    } else {
      console.error('ProtectedRoute: No slot found for UserPage');
    }
  }

  private renderSettingsPage(): void {
    const slot = this.element.querySelector('blitz-slot');
    if (slot) {
      slot.innerHTML = '';
    }

    // Create and mount SettingsPage component
    if (!this.settingsPageComponent) {
      this.settingsPageComponent = new SettingsPage();
    }

    // Mount the SettingsPage component to the slot
    if (slot) {
      this.settingsPageComponent.mount(slot as HTMLElement);
    } else {
      console.error('ProtectedRoute: No slot found for SettingsPage');
    }
  }

  protected onUnmount(): void {
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
    super.setState(newState);
    
    if (newState.isAuthenticated !== undefined || newState.isLoading !== undefined) {
      setTimeout(() => {
        this.render();
      }, 0);
    }
  }

  render() {
    if (this.state.isLoading) {
      this.element.innerHTML = `
        <div class="flex items-center justify-center h-screen">
          <div class="text-2xl text-[#B0D5D5] font-['Irish_Grover']">Loading...</div>
        </div>
      `;
      return;
    }

    if (!this.state.isAuthenticated) {
      this.element.innerHTML = `
        <div class="flex items-center justify-center h-screen">
          <div class="text-2xl text-[#B0D5D5] font-['Irish_Grover']">Redirecting to login...</div>
        </div>
      `;
      return;
    }

    this.element.innerHTML = '<blitz-slot></blitz-slot>';
    
    this.renderCurrentPage();
  }
} 