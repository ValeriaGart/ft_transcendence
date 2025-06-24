/**
 * Authentication Initialization Script
 * Call this to initialize authentication state when the app starts
 */

import { verifyAuthToken, initializeGoogleAuth } from './authState';

/**
 * Initialize authentication system
 * Should be called when the app starts
 */
export async function initializeAuth() {
  try {
    // Initialize Google Sign-in
    await initializeGoogleAuth();
    console.log('Google Sign-in initialized successfully');
    
    // Check if user is already authenticated
    const user = await verifyAuthToken();
    if (user) {
      console.log('User already authenticated:', user);
      return user;
    } else {
      console.log('No existing authentication found');
      return null;
    }
  } catch (error) {
    console.error('Authentication initialization failed:', error);
    return null;
  }
}

// Configure Google Identity Services when available
export function configureGoogleAuth() {
  if (typeof window !== 'undefined' && window.google) {
    window.google.accounts.id.initialize({
      client_id: 'your-google-client-id.apps.googleusercontent.com', // Replace with actual client ID from .env
      callback: (response: any) => {
        // This will be handled by the GoogleSignInButton component
        console.log('Global Google Sign-in callback:', response);
      },
      auto_select: false,
      cancel_on_tap_outside: true,
    });
  }
}
