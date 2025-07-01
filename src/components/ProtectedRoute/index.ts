import { Component } from "@blitz-ts/Component";
import { Router } from "@blitz-ts/router";
import { authService } from "../../lib/auth";
import type { AuthState } from "../../lib/auth";

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

  constructor(props?: ProtectedRouteProps) {
    super(props || { children: [] });
    console.log('ProtectedRoute constructor called with props:', props);
  }

  protected onMount(): void {
    console.log('ProtectedRoute onMount called');
    console.log('Current auth state:', authService.getAuthState());
    
    // Subscribe to auth state changes
    this.unsubscribe = authService.subscribe((authState: AuthState) => {
      console.log('ProtectedRoute received auth state update:', authState);
      
      this.setState({
        isAuthenticated: authState.isAuthenticated,
        isLoading: false,
      });

      // If not authenticated, redirect to login
      if (!authState.isAuthenticated && !this.state.isLoading) {
        console.log('User not authenticated, redirecting to login');
        Router.getInstance().navigate('/auth/signin');
      } else if (authState.isAuthenticated) {
        console.log('User is authenticated, should render children');
      }
    });
  }

  protected onUnmount(): void {
    console.log('ProtectedRoute onUnmount called');
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }

  render() {
    console.log('ProtectedRoute render called, state:', this.state);
    console.log('ProtectedRoute children:', this.children);
    
    if (this.state.isLoading) {
      console.log('Showing loading state');
      // Show loading state
      this.element.innerHTML = `
        <div class="flex items-center justify-center h-screen">
          <div class="text-2xl text-[#B0D5D5] font-['Irish_Grover']">Loading...</div>
        </div>
      `;
      return;
    }

    if (!this.state.isAuthenticated) {
      console.log('Showing unauthorized state');
      // Show unauthorized message (will redirect in onMount)
      this.element.innerHTML = `
        <div class="flex items-center justify-center h-screen">
          <div class="text-2xl text-[#B0D5D5] font-['Irish_Grover']">Redirecting to login...</div>
        </div>
      `;
      return;
    }

    console.log('User is authenticated, rendering children');
    // User is authenticated, render children
    this.element.innerHTML = '';
    if (this.children && this.children.length > 0) {
      console.log('Rendering', this.children.length, 'children');
      this.children.forEach((child, index) => {
        console.log('Rendering child', index, child);
        this.element.appendChild(child);
      });
    } else {
      console.log('No children to render');
    }
  }
} 