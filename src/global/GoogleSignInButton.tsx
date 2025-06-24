/**
 * Google Sign-in Button Component
 * Handles Google OAuth authentication flow with custom styling
 */

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
  }
}

export function GoogleSignInButton({ onSuccess, onError, className = '' }: GoogleSignInButtonProps) {
  let isInitialized = false;
  
  // Set to true for demo mode, false for real Google OAuth
  const USE_DEMO_MODE = false; // REAL Google authentication

  const initializeButton = async () => {
    if (isInitialized) return;
    
    try {
      await initializeGoogleAuth();
      
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: '921980179970-65l8tisfd4qls4497e846eg7mbj96lhg.apps.googleusercontent.com',
          callback: handleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: true,
          use_fedcm_for_prompt: true // Enable FedCM for better One Tap experience
        });
        
        isInitialized = true;
      }
    } catch (error) {
      console.error('Failed to initialize Google Sign-in:', error);
      onError?.('Failed to initialize Google Sign-in');
    }
  };

  const handleCredentialResponse = async (response: any) => {
    try {
      const user = await handleGoogleSignIn(response.credential);
      onSuccess?.(user);
    } catch (error) {
      console.error('Google Sign-in failed:', error);
      onError?.(error instanceof Error ? error.message : 'Google Sign-in failed');
    }
  };

  const handleClick = async () => {
    console.log('Google Sign-in button clicked');
    
    // Demo mode for testing without real Google credentials
    if (USE_DEMO_MODE) {
      const demoUser = {
        id: 999,
        email: 'demo@google.com',
        name: 'Demo Google User',
        profilePictureUrl: 'https://via.placeholder.com/150'
      };
      console.log('Demo Google Sign-in triggered');
      onSuccess?.(demoUser);
      return;
    }
    
    try {
      // Initialize Google if not already done
      await initializeButton();
      
      if (window.google && isInitialized) {
        console.log('Calling Google prompt...');
        
        // Only use the One Tap prompt - no fallback to renderButton
        window.google.accounts.id.prompt((notification: any) => {
          console.log('Google prompt notification:', notification);
          
          if (notification.isNotDisplayed()) {
            console.log('One Tap was not displayed');
            onError?.('Google One Tap is not available. This could be due to popup blockers or browser settings.');
          } else if (notification.isSkippedMoment()) {
            console.log('One Tap was skipped');
            onError?.('Google Sign-in was cancelled or skipped.');
          }
        });
        
      } else {
        console.error('Google not initialized or not available');
        onError?.('Google Sign-in not available. Please check your internet connection.');
      }
    } catch (error) {
      console.error('Google Sign-in error:', error);
      onError?.('Failed to initialize Google Sign-in');
    }
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
