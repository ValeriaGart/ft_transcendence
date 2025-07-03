import { Component } from "@blitz-ts/Component";
import { Router } from "@blitz-ts/router";
import { authService } from "../../lib/auth";
import { Error as ErrorComponent } from "../Error";

interface SettingsPageState {
  currentPage: 'page1' | 'page2' | 'confirm';
  pendingChanges: {
    username?: string;
    email?: string;
    bio?: string;
  };
  isLoading: boolean;
  showError: boolean;
  errorMessage: string | null;
}

export class SettingsPage extends Component<SettingsPageState> {

  private currentErrorComponent: ErrorComponent | null = null;

  protected static state: SettingsPageState = {
    currentPage: 'page1',
    pendingChanges: {},
    isLoading: false,
    showError: false,
    errorMessage: null,
  }

  constructor() {
    super();
  }

  private showError(message: string) {
    this.setState({
        showError: true,
        errorMessage: message
    });

    this.displayErrorComponent(message);
  }

  private hideError() {
      this.setState({
          showError: false,
          errorMessage: null
      });

      // Remove the error component
      this.removeErrorComponent();
  }

  private displayErrorComponent(message: string) {
        console.log('Creating error component with message:', message);
        
        // Remove any existing error component first
        this.removeErrorComponent();

        const errorComponent = new ErrorComponent({
            message: message,
            onClose: () => this.hideError()
        });
        
        console.log('Error component created:', errorComponent);
        
        // Mount error component to the page
        errorComponent.mount(this.element);
        
        console.log('Error component mounted to:', this.element);
        
        // Store reference to remove later
        this.currentErrorComponent = errorComponent;
    }

    private removeErrorComponent() {
        if (this.currentErrorComponent) {
            this.currentErrorComponent.unmount();
            this.currentErrorComponent = null;
        }
    }

  protected onMount(): void {
    this.setupEventListeners();
    this.updatePageVisibility();
    this.loadCurrentUserData();
  }

  private setupEventListeners(): void {
    // Next page button (shows page 2)
    this.addEventListener('#next_page', 'click', (e) => {
      e.preventDefault();
      console.log('Next page clicked');
      this.setState({ currentPage: 'page2' });
      this.updatePageVisibility();
    });

    // Previous page button (shows page 1)
    this.addEventListener('#previous_page', 'click', (e) => {
      e.preventDefault();
      console.log('Previous page clicked');
      this.setState({ currentPage: 'page1' });
      this.updatePageVisibility();
    });

    // Confirm button from page 1 (shows confirm page)
    this.addEventListener('#confirm_button_page1', 'click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('Confirm button clicked from page 1, switching to confirm page');
      
      // Capture form data from page 1
      const usernameInput = this.element.querySelector('#username') as HTMLInputElement;
      const emailInput = this.element.querySelector('#email') as HTMLInputElement;
      
      const pendingChanges: any = {};
      if (usernameInput && usernameInput.value.trim()) {
        pendingChanges.username = usernameInput.value.trim();
      }
      if (emailInput && emailInput.value.trim()) {
        pendingChanges.email = emailInput.value.trim();
      }
      
      // Check if any changes were made
      if (Object.keys(pendingChanges).length === 0) {
        Router.getInstance().navigate('/user');
      }
      
      this.setState({ 
        currentPage: 'confirm',
        pendingChanges: { ...this.state.pendingChanges, ...pendingChanges }
      });
      setTimeout(() => {
        this.updatePageVisibility();
      }, 10);
    });

    // Confirm button from page 2 (shows confirm page)
    this.addEventListener('#confirm_button_page2', 'click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('Confirm button clicked from page 2, switching to confirm page');
      
      // Capture form data from page 2
      const bioInput = this.element.querySelector('#bio') as HTMLTextAreaElement;
      
      const pendingChanges: any = {};
      if (bioInput && bioInput.value.trim()) {
        pendingChanges.bio = bioInput.value.trim();
      }
      
      // Check if any changes were made
      if (Object.keys(pendingChanges).length === 0) {
        Router.getInstance().navigate('/user');
      }
      
      this.setState({ 
        currentPage: 'confirm',
        pendingChanges: { ...this.state.pendingChanges, ...pendingChanges }
      });
      setTimeout(() => {
        this.updatePageVisibility();
      }, 10);
    });

    // Quit button (goes back to user page)
    this.addEventListener('#quit_button', 'click', (e) => {
      e.preventDefault();
      console.log('Quit button clicked, navigating back to user page');
      Router.getInstance().navigate('/user');
    });

    // Confirm button on confirm page (validates password and updates backend)
    this.addEventListener('#confirm_button', 'click', async (e) => {
      e.preventDefault();
      console.log('Password confirmed! Processing updates...');
      
      const passwordInput = this.element.querySelector('#password') as HTMLInputElement;
      if (!passwordInput || !passwordInput.value.trim()) {
        alert('Please enter your password');
        return;
      }
      
      const password = passwordInput.value.trim();
      
      // Check if there are any pending changes
      if (Object.keys(this.state.pendingChanges).length === 0) {
        console.log('No changes to save, navigating back to user page');
        Router.getInstance().navigate('/user');
        return;
      }
      
      this.setState({ isLoading: true, error: null });
      
      try {
        // First verify the password by trying to authenticate with current user's email
        const currentUser = authService.getCurrentUser();
        if (!currentUser) {
          throw new Error('No user logged in');
        }
        
        const verifyResponse = await fetch('http://localhost:3000/users/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ 
            email: currentUser.email, 
            passwordString: password 
          }),
        });
        
        if (!verifyResponse.ok) {
          throw new Error('Invalid password');
        }
        
        // Password is valid, now update the user data
        await this.updateUserData();
        
        console.log('Updates successful! Navigating back to user page');
        Router.getInstance().navigate('/user');
        
      } catch (error) {
        console.error('Error processing updates:', error);
        this.setState({ 
          error: error instanceof Error ? error.message : 'An error occurred',
          isLoading: false 
        });
        
        if (error instanceof Error && error.message === 'Invalid password') {
          alert('Invalid password. Please try again.');
        } else {
          alert('Failed to update settings. Please try again.');
        }
      }
    });

    // Sign out button (goes to entry screen) - works on both pages
    this.addEventListener('#signout_button', 'click', async (e) => {
      e.preventDefault();
      console.log('Sign out button clicked, logging out and navigating to entry screen');
      
      try {
        // Call backend logout and clear local auth state
        await authService.logout();
        console.log('Logout successful');
      } catch (error) {
        console.error('Logout error:', error);
        // Even if backend logout fails, the logout method should still clear local auth state
      }
      
      // Navigate to entry screen
      Router.getInstance().navigate('/');
    }, { capture: true });

    // Delete user button on page 2 specifically (since page might be hidden)
    this.addEventListener('#settings_page2 #delete_button', 'click', async (e) => {
      e.preventDefault();
      console.log('Delete user button clicked from page 2, deleting user account');
      
      // Show confirmation dialog
      const confirmed = confirm('Are you sure you want to delete your account? This action cannot be undone.');
      
      if (confirmed) {
        try {
          // Call backend delete user and clear local auth state
          const result = await authService.deleteUser();
          if (result.success) {
            console.log('User deleted successfully');
            // Navigate to entry screen
            Router.getInstance().navigate('/');
          } else {
            console.error('Delete user failed:', result.error);
            alert('Failed to delete user: ' + result.error);
          }
        } catch (error) {
          console.error('Delete user error:', error);
          alert('An error occurred while deleting your account');
        }
      }
    });
  }

  private updatePageVisibility(): void {
    console.log('Updating page visibility, current page:', this.state.currentPage);
    
    const confirmPage = this.element.querySelector('#settings_confirm') as HTMLElement;
    const page1 = this.element.querySelector('#settings_page1') as HTMLElement;
    const page2 = this.element.querySelector('#settings_page2') as HTMLElement;

    console.log('Found elements:', { confirmPage: !!confirmPage, page1: !!page1, page2: !!page2 });

    // Hide all pages first
    if (confirmPage) {
      confirmPage.style.display = 'none';
      console.log('Hidden confirm page');
    }
    if (page1) {
      page1.style.display = 'none';
      console.log('Hidden page 1');
    }
    if (page2) {
      page2.style.display = 'none';
      console.log('Hidden page 2');
    }

    // Show the current page
    switch (this.state.currentPage) {
      case 'confirm':
        if (confirmPage) {
          confirmPage.style.display = 'block';
          console.log('Showing confirm page');
        }
        break;
      case 'page1':
        if (page1) {
          page1.style.display = 'block';
          console.log('Showing page 1');
        }
        break;
      case 'page2':
        if (page2) {
          page2.style.display = 'block';
          console.log('Showing page 2');
        }
        break;
    }
  }

  private loadCurrentUserData(): void {
    // Pre-fill form fields with current user data
    const currentUser = authService.getCurrentUser();
    if (currentUser) {
      const emailInput = this.element.querySelector('#email') as HTMLInputElement;
      if (emailInput) {
        emailInput.value = currentUser.email;
      }
    }
    
    // Load profile data for username and bio
    this.loadProfileData();
  }

  private async loadProfileData(): Promise<void> {
    try {
      const response = await authService.authenticatedFetch('http://localhost:3000/profiles/me');
      if (response.ok) {
        const profileData = await response.json();
        
        const usernameInput = this.element.querySelector('#username') as HTMLInputElement;
        const bioInput = this.element.querySelector('#bio') as HTMLTextAreaElement;
        
        if (usernameInput && profileData.nickname) {
          usernameInput.value = profileData.nickname;
        }
        if (bioInput && profileData.bio) {
          bioInput.value = profileData.bio;
        }
      }
    } catch (error) {
      console.error('Error loading profile data:', error);
    }
  }

  private async updateUserData(): Promise<void> {
    const { pendingChanges } = this.state;
    
    // Update user email if provided
    if (pendingChanges.email) {
      const currentUser = authService.getCurrentUser();
      if (!currentUser) {
        throw new Error('No user logged in');
      }
      
      const userResponse = await authService.authenticatedFetch(`http://localhost:3000/users/${currentUser.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: pendingChanges.email }),
      });
      
      if (!userResponse.ok) {
        const errorData = await userResponse.json();
        throw new Error(errorData.error || 'Failed to update email');
      }
      
      // Update local auth state with new email
      const updatedUser = await userResponse.json();
      // Update localStorage directly and refresh auth state
      localStorage.setItem('auth_user', JSON.stringify(updatedUser));
      // Trigger auth state refresh by calling verifyAuth
      await authService.verifyAuth();
    }
    
    // Update profile data (nickname and bio) if provided
    if (pendingChanges.username || pendingChanges.bio) {
      const currentUser = authService.getCurrentUser();
      if (!currentUser) {
        throw new Error('No user logged in');
      }
      
      // Get the user's profile first
      const profileResponse = await authService.authenticatedFetch('http://localhost:3000/profiles/me');
      if (!profileResponse.ok) {
        throw new Error('Failed to get profile data');
      }
      
      const profileData = await profileResponse.json();
      
      // Prepare update data
      const updateData: any = {};
      if (pendingChanges.username) {
        updateData.nickname = pendingChanges.username;
      }
      if (pendingChanges.bio) {
        updateData.bio = pendingChanges.bio;
      }
      
      // Update the profile
      const updateResponse = await authService.authenticatedFetch(`http://localhost:3000/profiles/${profileData.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });
      
      if (!updateResponse.ok) {
        const errorData = await updateResponse.json();
        throw new Error(errorData.error || 'Failed to update profile');
      }
    }
    
    this.setState({ isLoading: false, pendingChanges: {} });
  }
    
  render() {
    // The template system will handle the rendering
  }
} 