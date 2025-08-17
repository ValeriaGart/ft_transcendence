import { Component } from "@blitz-ts/Component";
import { initializeGoogleAuth, handleGoogleSignIn } from "../../lib/authState";

interface GoogleSignInButtonProps {
  onSuccess?: (user: any) => void;
  onError?: (error: string) => void;
  className?: string;
}

interface GoogleSignInButtonState {
  isInitialized: boolean;
}

export class GoogleSignInButton extends Component<GoogleSignInButtonProps, GoogleSignInButtonState> {
  protected static state: GoogleSignInButtonState = {
    isInitialized: false,
  };

  constructor(props: GoogleSignInButtonProps) {
    super(props);
    this.handleClick = this.handleClick.bind(this);
  }

  protected onMount(): void {
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    const button = this.element.querySelector('.google-signin-button');
    if (button) {
      button.addEventListener('click', this.handleClick);
    }
  }

  private async initializeButton(): Promise<void> {
    if (this.state.isInitialized) return;
    
    try {
      await initializeGoogleAuth();
      
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: '921980179970-65l8tisfd4qls4497e846eg7mbj96lhg.apps.googleusercontent.com',
          callback: this.handleGoogleCredentialResponse.bind(this),
          auto_select: false,
          cancel_on_tap_outside: true,
          context: 'signin',
          ux_mode: 'popup',
          use_fedcm_for_prompt: false
        });
        
        this.setState({ isInitialized: true });
      } else {
        this.props.onError?.('Google Sign-in service not available');
      }
    } catch (error) {
      console.error('Failed to initialize Google Sign-in:', error);
      this.props.onError?.('Failed to initialize Google Sign-in');
    }
  }

  private handleGoogleCredentialResponse(response: any): void {
    handleGoogleSignIn(response.credential)
      .then((user) => {
        this.props.onSuccess?.(user);
      })
      .catch((error) => {
        console.error('Google Sign-in failed:', error);
        let errorMessage = 'Google Sign-in failed';
        
        if (error instanceof Error) {
          if (error.message.includes('Invalid') || error.message.includes('401')) {
            errorMessage = 'Google authentication failed. OAuth configuration issue detected. Please use email/password login instead.';
          } else if (error.message.includes('redirect_uri_mismatch') || error.message.includes('400')) {
            errorMessage = `Google Sign-in configuration error. The current URL (${window.location.origin}) is not authorized. Please use email/password login instead.`;
          } else {
            errorMessage = error.message;
          }
        }
        
        this.props.onError?.(errorMessage);
      });
  }

  private async handleClick(): Promise<void> {
    try {
      await this.initializeButton();
      
      // Check if Google is actually available after initialization
      if (window.google) {
        try {
          window.google.accounts.id.prompt((notification: any) => {
            if (notification.isNotDisplayed()) {
              this.renderGoogleButton();
            } else if (notification.isSkippedMoment()) {
              this.props.onError?.('Google Sign-in was cancelled. You can try again or use email/password login.');
            }
          });
        } catch (promptError) {
          this.renderGoogleButton();
        }
        
      } else {
        console.error('Google not initialized or not available');
        this.props.onError?.('Google Sign-in not available. Please check your internet connection.');
      }
    } catch (error) {
      console.error('Google Sign-in error:', error);
      this.props.onError?.('Failed to initialize Google Sign-in');
    }
  }

  private renderGoogleButton(): void {
    // Create a temporary container for Google button
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.top = '50%';
    container.style.left = '50%';
    container.style.transform = 'translate(-50%, -50%)';
    container.style.zIndex = '10000';
    container.style.background = 'white';
    container.style.padding = '20px';
    container.style.borderRadius = '8px';
    container.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
    
    const closeButton = document.createElement('button');
    closeButton.innerHTML = '×';
    closeButton.style.position = 'absolute';
    closeButton.style.top = '10px';
    closeButton.style.right = '10px';
    closeButton.style.border = 'none';
    closeButton.style.background = 'none';
    closeButton.style.fontSize = '20px';
    closeButton.style.cursor = 'pointer';
    closeButton.onclick = () => document.body.removeChild(container);
    
    container.appendChild(closeButton);
    document.body.appendChild(container);
    
    window.google.accounts.id.renderButton(container, {
      theme: 'outline',
      size: 'large',
      type: 'standard',
      text: 'signin_with',
      shape: 'rectangular'
    });
  }

  render() {}
} 