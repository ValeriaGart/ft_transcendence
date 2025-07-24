import { Component } from "@blitz-ts/Component";
import { Router } from "@blitz-ts/router";
import { authService } from "../../lib/auth";
import { ErrorManager } from "../Error";
import { ConfirmDialogManager } from "../ConfirmDialog";
import { getApiUrl } from "../../config/api";

interface SettingsPageState {
  currentPage: 'page1' | 'page2' | 'confirm' | 'password_change';
  pendingChanges: {
    username?: string;
    email?: string;
    bio?: string;
  };
  originalValues: {
    username?: string;
    email?: string;
    bio?: string;
  };
  isLoading: boolean;
  showError: boolean;
  errorMessage: string | null;
  isGoogleUser: boolean;
}

export class SettingsPage extends Component<SettingsPageState> {

  protected static state: SettingsPageState = {
    currentPage: 'page1',
    pendingChanges: {},
    originalValues: {},
    isLoading: false,
    showError: false,
    errorMessage: null,
    isGoogleUser: false,
  }

  constructor() {
    super();
  }

  private showError(message: string) {
    this.setState({
        showError: true,
        errorMessage: message
    });

    ErrorManager.showError(message, this.element, () => {
        this.setState({
            showError: false,
            errorMessage: null
        });
    });
  }

  protected onMount(): void {
    console.log('SettingsPage onMount called, current URL:', window.location.pathname);
    
    // Reset state to initial values when mounting
    this.setState({
      currentPage: 'page1',
      pendingChanges: {},
      originalValues: {},
      isLoading: false,
      showError: false,
      errorMessage: null,
    });
    
    console.log('SettingsPage mounted, reset to page1');
    this.setupEventListeners();
    this.loadCurrentUserData();
    this.updatePageVisibility();
    this.checkUserAuthType();
  }

  private async checkUserAuthType(): Promise<void> {
    try {
      const authTypeResult = await authService.getUserAuthType();
      if (authTypeResult.success && authTypeResult.authType) {
        const { authType } = authTypeResult;
        this.setState({ isGoogleUser: authType.isGoogleUser });
        
        // Hide password confirmation elements for Google users
        if (authType.isGoogleUser) {
          this.hidePasswordElements();
          this.disableEmailInput();
        }
        
        // Hide change password button for Google-only users
        if (authType.isGoogleUser) {
          const changePasswordButton = this.element.querySelector('#change_password') as HTMLElement;
          if (changePasswordButton) {
            changePasswordButton.style.display = 'none';
          }
        }
      }
    } catch (error) {
      console.error('Error checking user auth type:', error);
    }
  }

  private disableEmailInput(): void {
    const emailInput = this.element.querySelector('#email') as HTMLInputElement;
    if (emailInput) {
      emailInput.style.backgroundColor = '#f5f5f5';
      emailInput.style.color = '#999';
      emailInput.style.cursor = 'not-allowed';
      emailInput.title = 'Gmail addresses cannot be changed';
    }
  }

  private hidePasswordElements(): void {
    const passwordConfirmDiv = this.element.querySelector('#settings_confirm') as HTMLElement;
    if (passwordConfirmDiv) {
      // Hide the password input and label for Google users
      const passwordLabel = passwordConfirmDiv.querySelector('label[for="password"]') as HTMLElement;
      const passwordInput = passwordConfirmDiv.querySelector('#password') as HTMLElement;
      
      if (passwordLabel) passwordLabel.style.display = 'none';
      if (passwordInput) passwordInput.style.display = 'none';
      
      // Update the confirm button text for Google users
      const confirmForm = passwordConfirmDiv.querySelector('#confirm_form') as HTMLElement;
      if (confirmForm) {
        const existingLabel = confirmForm.querySelector('label[for="password"]');
        if (existingLabel && existingLabel.parentNode) {
          // Replace password prompt with general confirmation
          const newLabel = document.createElement('label');
          newLabel.className = 'text-[#B784F2] font-[\'Irish_Grover\'] text-[20px] md:text-[3vw] lg:text-[30px]';
          newLabel.textContent = 'Confirm your changes';
          existingLabel.parentNode.replaceChild(newLabel, existingLabel);
        }
      }
    }
  }

  private setupEventListeners(): void {
    this.addEventListener('#next_page', 'click', (e) => {
      e.preventDefault();
      this.setState({ currentPage: 'page2' });
      this.updatePageVisibility();
    });

    this.addEventListener('#previous_page', 'click', (e) => {
      e.preventDefault();
      this.setState({ currentPage: 'page1' });
      this.updatePageVisibility();
    });

    this.addEventListener('#confirm_button_page1', 'click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      const usernameInput = this.element.querySelector('#username') as HTMLInputElement;
      const emailInput = this.element.querySelector('#email') as HTMLInputElement;
      
      const pendingChanges: any = {};
      
      // Compare username changes
      const currentUsername = usernameInput ? usernameInput.value.trim() : '';
      const originalUsername = this.state.originalValues.username || '';
      if (currentUsername !== originalUsername) {
        pendingChanges.username = currentUsername;
      }
      
      // Compare email changes
      const currentEmail = emailInput ? emailInput.value.trim() : '';
      const originalEmail = this.state.originalValues.email || '';
      if (currentEmail !== originalEmail) {
        pendingChanges.email = currentEmail;
      }

      console.log('Pending changes:', pendingChanges);
      
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

    this.addEventListener('#confirm_button_page2', 'click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      const bioInput = this.element.querySelector('#bio') as HTMLTextAreaElement;
      const usernameInput = this.element.querySelector('#username') as HTMLInputElement;
      const emailInput = this.element.querySelector('#email') as HTMLInputElement;
      
      const pendingChanges: any = {};
      
      // Compare username changes
      const currentUsername = usernameInput ? usernameInput.value.trim() : '';
      const originalUsername = this.state.originalValues.username || '';
      if (currentUsername !== originalUsername) {
        pendingChanges.username = currentUsername;
      }
      
      // Compare email changes
      const currentEmail = emailInput ? emailInput.value.trim() : '';
      const originalEmail = this.state.originalValues.email || '';
      if (currentEmail !== originalEmail) {
        pendingChanges.email = currentEmail;
      }
      
      // Compare bio changes
      const currentBio = bioInput ? bioInput.value.trim() : '';
      const originalBio = this.state.originalValues.bio || '';
      if (currentBio !== originalBio) {
        pendingChanges.bio = currentBio;
      }
      
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

    this.addEventListener('#quit_button', 'click', (e) => {
      e.preventDefault();
      console.log('Quit button clicked, navigating back to user page');
      Router.getInstance().navigate('/user');
    });

    this.addEventListener('#confirm_button', 'click', async (e) => {
      e.preventDefault();
    
      this.setState({ isLoading: true, error: null });

      try {
        const currentUser = authService.getCurrentUser();
        if (!currentUser) {
          throw new Error('No user logged in');
        }
        
        // Get user authentication type
        const authTypeResult = await authService.getUserAuthType();
        if (!authTypeResult.success) {
          throw new Error(authTypeResult.error || 'Failed to get authentication type');
        }
        
        const { authType } = authTypeResult;
        console.log('User auth type:', authType);
        
        // Only verify password for password-based users
        if (authType.isPasswordUser || authType.isHybridUser) {
          const passwordInput = this.element.querySelector('#password') as HTMLInputElement;
          if (!passwordInput || !passwordInput.value.trim()) {
            this.setState({ isLoading: false });
            this.showError('Please enter your password');
            return;
          }
          
          const password = passwordInput.value.trim()
          
          const verifyResponse = await authService.authenticatedFetch(getApiUrl('/users/me/verify-password'), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              password: password 
            }),
          });
          
          if (!verifyResponse.ok) {
            const errorText = await verifyResponse.text();
            console.log('Password verification error response:', errorText);
            this.setState({ isLoading: false });
            this.showError('Invalid password');
            return;
          }
        } else if (authType.isGoogleUser) {
          console.log('Google user detected - skipping password verification');
         
        }
        
        // Password is valid (or not needed), now update the user data
        await this.updateUserData();
        
        Router.getInstance().navigate('/user');
        
      } catch (error) {
        console.error('Error processing updates:', error);
        this.setState({ 
          error: error instanceof Error ? error.message : 'An error occurred',
          isLoading: false 
        });
        
        if (error instanceof Error && error.message.includes('Unauthorized')) {
          this.showError('Your session has expired. Please log in again.');
          Router.getInstance().navigate('/');
        } else {
          this.showError('Failed to update settings. Please try again.');
        }
      }
    });

    // Sign out button (goes to entry screen) - works on both pages
    this.addEventListener('#signout_button', 'click', async (e) => {
      e.preventDefault();
      console.log('Sign out button clicked, showing logout confirmation');
      
      // Show custom confirmation dialog
      ConfirmDialogManager.showConfirm(
        'Are you sure you want to sign out?',
        this.element,
        async () => {
          // User clicked "Yes" - proceed with logout
          try {
            // Call backend logout and clear local auth state
            await authService.logout();
            console.log('Logout successful');
          } catch (error) {
            console.error('Logout error:', error);
            // Even if backend logout fails, the logout method should still clear local auth state
          }
          
          Router.getInstance().navigate('/');
        },
        () => {
          // User clicked "No" - do nothing
          console.log('User cancelled logout');
        }
      );
    }, { capture: true });

    this.addEventListener('#settings_page2 #delete_button', 'click', async (e) => {
      e.preventDefault();
      console.log('Delete user button clicked from page 2, deleting user account');
      
      // Show custom confirmation dialog
      ConfirmDialogManager.showConfirm(
        'Are you sure you want to delete your account?',
        this.element,
        async () => {
          // User clicked "Yes" - proceed with deletion
          try {
            const result = await authService.deleteUser();
            if (result.success) {
              console.log('User deleted successfully');
              Router.getInstance().navigate('/');
            } else {
              console.error('Delete user failed:', result.error);
              this.showError('Failed to delete user: ' + result.error);
            }
          } catch (error) {
            console.error('Delete user error:', error);
            this.showError('An error occurred while deleting your account');
          }
        },
        () => {
          // User clicked "No" - do nothing
          console.log('User cancelled account deletion');
        }
      );
    });

    // Change password button (shows password change page)
    this.addEventListener('#change_password', 'click', (e) => {
      e.preventDefault();
      console.log('Change password button clicked');
      this.setState({ currentPage: 'password_change' });
      this.updatePageVisibility();
    });

    // Quit password change button (goes back to page 2)
    this.addEventListener('#quit_password_change', 'click', (e) => {
      e.preventDefault();
      Router.getInstance().navigate('/user');
    });

    // Confirm password change button
    this.addEventListener('#confirm_password_change', 'click', async (e) => {
      e.preventDefault();
      console.log('Confirm password change clicked');
      
      const currentPasswordInput = this.element.querySelector('#current_password') as HTMLInputElement;
      const newPasswordInput = this.element.querySelector('#new_password') as HTMLInputElement;
      
      if (!currentPasswordInput || !currentPasswordInput.value.trim()) {
        this.showError('Please enter your current password');
        return;
      }
      
      if (!newPasswordInput || !newPasswordInput.value.trim()) {
        this.showError('Please enter your new password');
        return;
      }
      
      const currentPassword = currentPasswordInput.value.trim();
      const newPassword = newPasswordInput.value.trim();
      
      this.setState({ isLoading: true });
      
      try {
        // First verify the current password by trying to authenticate
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
            passwordString: currentPassword 
          }),
        });
        
        if (!verifyResponse.ok) {
          throw new Error('Invalid current password');
        }
        
        // Current password is valid, now change the password TODO
        const changePasswordResponse = await authService.authenticatedFetch(`http://localhost:3000/users/${currentUser.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ passwordString: newPassword }),
        });
        
        if (!changePasswordResponse.ok) {
          const errorData = await changePasswordResponse.json();
          if (changePasswordResponse.status === 401) {
            throw new Error('Unauthorized: Session expired');
          }
          throw new Error(errorData.error || 'Failed to change password');
        }
        
        console.log('Password changed successfully!');
        this.showError('Password changed successfully!');
        
        // Clear the password fields
        if (currentPasswordInput) currentPasswordInput.value = '';
        if (newPasswordInput) newPasswordInput.value = '';
        
        // Go back to page 2
        this.setState({ currentPage: 'page2' });
        this.updatePageVisibility();
        
      } catch (error) {
        console.error('Error changing password:', error);
        this.setState({ isLoading: false });
        
        if (error instanceof Error && error.message === 'Invalid current password') {
          this.showError('Invalid current password. Please try again.');
        } else if (error instanceof Error && error.message.includes('Unauthorized')) {
          this.showError('Your session has expired. Please log in again.');
          Router.getInstance().navigate('/');
        } else {
          this.showError('Failed to change password. Please try again.');
        }
      }
    });
    
    // Add additional protection for Google users' email input
    this.addEventListener('#email', 'input', (e) => {
      if (this.state.isGoogleUser) {
        const emailInput = e.target as HTMLInputElement;
        emailInput.value = this.state.originalValues.email || '';
        this.showError('Ups! Change your gmail\'s address is a naughty move.');
      }
    });
    
    this.addEventListener('#email', 'keydown', (e) => {
      if (this.state.isGoogleUser) {
        const keyboardEvent = e as KeyboardEvent;
        // Allow navigation keys but prevent typing
        const allowedKeys = ['Tab', 'Escape', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'];
        if (!allowedKeys.includes(keyboardEvent.key)) {
          e.preventDefault();
          this.showError('Ups! Change your gmail\'s address is a naughty move.');
        }
      }
    });
    
    this.addEventListener('#email', 'paste', (e) => {
      if (this.state.isGoogleUser) {
        e.preventDefault();
        this.showError('Ups! Change your gmail\'s address is a naughty move.');
      }
    });
  }

  private updatePageVisibility(): void {
    console.log('Updating page visibility, current page:', this.state.currentPage);
    
    const confirmPage = this.element.querySelector('#settings_confirm') as HTMLElement;
    const passwordChangePage = this.element.querySelector('#change_password_confirm') as HTMLElement;
    const page1 = this.element.querySelector('#settings_page1') as HTMLElement;
    const page2 = this.element.querySelector('#settings_page2') as HTMLElement;

    console.log('Found elements:', { confirmPage: !!confirmPage, passwordChangePage: !!passwordChangePage, page1: !!page1, page2: !!page2 });

    // Hide all pages first
    if (confirmPage) {
      confirmPage.style.display = 'none';
      console.log('Hidden confirm page');
    }
    if (passwordChangePage) {
      passwordChangePage.style.display = 'none';
      console.log('Hidden password change page');
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
      case 'password_change':
        if (passwordChangePage) {
          passwordChangePage.style.display = 'block';
          console.log('Showing password change page');
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

    const currentUser = authService.getCurrentUser();
    console.log('SettingsPage: Loading current user data:', currentUser);
    
    if (currentUser && currentUser.email) {
      const emailInput = this.element.querySelector('#email') as HTMLInputElement;
      if (emailInput) {
        emailInput.value = currentUser.email;
        console.log('SettingsPage: Set email input to:', currentUser.email);
      }
      
      this.setState({ 
        originalValues: { 
          ...this.state.originalValues, 
          email: currentUser.email 
        } 
      });
      console.log('SettingsPage: Set original email to:', currentUser.email);
    } else {
      console.log('SettingsPage: No current user or email is undefined/null');
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
        
        const originalValues: any = {};
        
        if (usernameInput && profileData.nickname) {
          usernameInput.value = profileData.nickname;
          originalValues.username = profileData.nickname;
        }
        if (bioInput && profileData.bio) {
          bioInput.value = profileData.bio;
          originalValues.bio = profileData.bio;
        }
        
        this.setState({ 
          originalValues: { 
            ...this.state.originalValues, 
            ...originalValues 
          } 
        });
        console.log('Set original values:', { ...this.state.originalValues, ...originalValues });
      } else if (response.status === 401) {
        // Token expired, redirect to login
        this.showError('Your session has expired. Please log in again.');
        Router.getInstance().navigate('/');
      }
    } catch (error) {
      console.error('Error loading profile data:', error);
      if (error instanceof Error && error.message.includes('Unauthorized')) {
        this.showError('Your session has expired. Please log in again.');
        Router.getInstance().navigate('/');
      }
    }
  }

  private async updateUserData(): Promise<void> {
    const { pendingChanges } = this.state;

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
        if (userResponse.status === 401) {
          throw new Error('Unauthorized: Session expired');
        }
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
        if (updateResponse.status === 401) {
          throw new Error('Unauthorized: Session expired');
        }
        throw new Error(errorData.error || 'Failed to update profile');
      }
    }
    
    this.setState({ isLoading: false, pendingChanges: {} });
  }
    
  protected onUnmount(): void {
    console.log('SettingsPage onUnmount called');
    // Remove any error components
    ErrorManager.removeError();
  }

  render() {}
} 