import { myJSX } from '../util/mini-jsx';
import { initializeGoogleAuth, handleGoogleSignIn } from '../util/auth/authState';

interface GoogleSignInButtonProps {
  onSuccess?: (user: any) => void;
  onError?: (error: string) => void;
  className?: string;
}

declare global {
  interface Window {
    google: any;
    handleGoogleCredentialResponse: (response: any) => void;
  }
}

export function GoogleSignInButton({ onSuccess, onError, className = '' }: GoogleSignInButtonProps) {
  let isInitialized = false;
  
  window.handleGoogleCredentialResponse = async (response: any) => {
    try {
      const user = await handleGoogleSignIn(response.credential);
      onSuccess?.(user);
    } catch (error) {
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
      
      onError?.(errorMessage);
    }
  };

  const initializeButton = async () => {
    if (isInitialized) return;
    
    try {
      await initializeGoogleAuth();
      
      if (window.google) {
        
        window.google.accounts.id.initialize({
          client_id: '921980179970-65l8tisfd4qls4497e846eg7mbj96lhg.apps.googleusercontent.com',
          callback: window.handleGoogleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: true,
          context: 'signin',
          ux_mode: 'popup',
          use_fedcm_for_prompt: false
        });
        
        isInitialized = true;
      } else {
        onError?.('Google Sign-in service not available');
      }
    } catch (error) {
      console.error('Failed to initialize Google Sign-in:', error);
      onError?.('Failed to initialize Google Sign-in');
    }
  };

  const handleClick = async () => {
    try {
      await initializeButton();
      
      if (window.google && isInitialized) {
        try {
          window.google.accounts.id.prompt((notification: any) => {
            if (notification.isNotDisplayed()) {
              onError?.('Google Sign-in not available. This could be due to OAuth configuration. Please check that localhost:5173 is added to authorized origins in Google Cloud Console, or use email/password login.');
              renderGoogleButton();
            } else if (notification.isSkippedMoment()) {
              onError?.('Google Sign-in was cancelled. You can try again or use email/password login.');
            }
          });
        } catch (promptError) {
          renderGoogleButton();
        }
        
      } else {
        console.error('Google not initialized or not available');
        onError?.('Google Sign-in not available. Please check your internet connection.');
      }
    } catch (error) {
      console.error('Google Sign-in error:', error);
      onError?.('Failed to initialize Google Sign-in');
    }
  };

  const renderGoogleButton = () => {
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
  };

  return myJSX('div', {
    onClick: handleClick,
    class: `cursor-pointer hover:opacity-80 transition-opacity ${className}`,
    title: 'Sign in with Google'
  }, 
    myJSX('img', {
      src: '/art/signin_up/Google_signin.svg',
      alt: 'Sign in with Google',
      class: 'h-auto w-auto'
    })
  );
}
