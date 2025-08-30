import { Component } from "@blitz-ts/Component";
import { Router } from "@blitz-ts/router";
import { ErrorManager } from "../Error";
import { authService } from "../../lib/auth";
import { COMMON_TLDS, VALID_COUNTRY_TLDS } from "../../utils/emailTLDs";

interface SignUpPageState {
    email: string;
    password: string;
    confirmPassword: string;
    isEmailValid: boolean;
    isPasswordValid: boolean;
    showError: boolean;
    isConfirmPasswordValid: boolean;
    errorMessage: string | null;
    isGoogleLoading: boolean;
}

declare global {
  interface Window {
    google: any;
    handleGoogleCredentialResponse: (response: any) => void;
  }
}

export class SignUpPage extends Component<SignUpPageState> {

    protected static state: SignUpPageState = {
        email: "",
        password: "",
        confirmPassword: "",
        isEmailValid: false,
        isPasswordValid: false,
        isConfirmPasswordValid: false,
        showError: false,
        errorMessage: null,
        isGoogleLoading: false,
    };

    constructor() {
        super();
        this.handleSignUp = this.handleSignUp.bind(this);
        this.handleEmailChange = this.handleEmailChange.bind(this);
        this.handlePasswordChange = this.handlePasswordChange.bind(this);
        this.handleConfirmPasswordChange = this.handleConfirmPasswordChange.bind(this);
        this.handleGoogleSignIn = this.handleGoogleSignIn.bind(this);
        this.initializeGoogleAuth = this.initializeGoogleAuth.bind(this);
    }

    private validateEmail(email: string): boolean {
        // More comprehensive email validation
        const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
        
        if (!email || typeof email !== 'string') {
            return false;
        }
        
        if (email.length > 254) {
            return false;
        }
        
        const parts = email.split('@');
        if (parts.length !== 2) {
            return false;
        }
        
        const localPart = parts[0];
        const domainPart = parts[1];
        
        // Local part validation (max 64 characters)
        if (localPart.length > 64 || localPart.length === 0) {
            return false;
        }
        
        // Domain part validation (max 253 characters)
        if (domainPart.length > 253 || domainPart.length === 0) {
            return false;
        }
        
        // Check for leading/trailing dots in local part
        if (localPart.startsWith('.') || localPart.endsWith('.')) {
            return false;
        }
        
        // Check for consecutive dots in local part
        if (localPart.includes('..')) {
            return false;
        }
        
        // Check for leading/trailing dots in domain part
        if (domainPart.startsWith('.') || domainPart.endsWith('.')) {
            return false;
        }
        
        // Check for consecutive dots in domain part
        if (domainPart.includes('..')) {
            return false;
        }
        
        // Check for leading/trailing hyphens in domain part
        if (domainPart.startsWith('-') || domainPart.endsWith('-')) {
            return false;
        }
        
        const domainParts = domainPart.split('.');
        if (domainParts.length > 4) {
            return false;
        }
        
        // Check that no domain part starts or ends with hyphens
        for (const part of domainParts) {
            if (part.startsWith('-') || part.endsWith('-')) {
                return false;
            }
        }
        
        // Ensure domain has at least one dot (TLD requirement)
        if (!domainPart.includes('.')) {
            return false;
        }
        
        const commonTLDs = COMMON_TLDS;
        
        // Handle 2-part domains (e.g., example.com)
        if (domainParts.length === 2) {
            const secondPart = domainParts[1];
            // Check if the second part is a valid TLD
            if (!commonTLDs.includes(secondPart)) {
                return false;
            }
            return true;
        }
        
        // Handle 3-part domains (e.g., sub.example.com, example.co.uk)
        if (domainParts.length === 3) {
            const secondPart = domainParts[1];
            const thirdPart = domainParts[2];
            
            // Define valid country TLD combinations
            const validCountryTLDs = VALID_COUNTRY_TLDS;
            
            // This should be checked FIRST to allow both example.co.uk and sub.example.co.uk
            const countryTLD = secondPart + '.' + thirdPart;
            if (validCountryTLDs.includes(countryTLD)) {
                // This is valid: sub.example.co.uk, example.co.uk
                return true;
            }
            
            // Reject: example.com.com, example.org.com, example.com.org
            if (commonTLDs.includes(secondPart) && commonTLDs.includes(thirdPart)) {
                return false;
            }
            
            // Allow valid subdomain patterns: sub.example.com, mail.example.org
            if (commonTLDs.includes(thirdPart)) {
                return true;
            }
            
            return false;
        }
        
        // Handle 4-part domains (e.g., sub.example.co.uk, sub.example.com.au)
        if (domainParts.length === 4) {
            const thirdPart = domainParts[2];
            const fourthPart = domainParts[3];
            
            // Define valid country TLD combinations
            const validCountryTLDs = VALID_COUNTRY_TLDS;

            const lastTwoParts = thirdPart + '.' + fourthPart;
            
            // If the last two parts form a valid country TLD, this is a valid subdomain
            if (validCountryTLDs.includes(lastTwoParts)) {
                return true;
            }
            
            // Check for invalid double TLD patterns in the last three parts
            if (commonTLDs.includes(thirdPart) && commonTLDs.includes(fourthPart)) {
                return false;
            }
            
            // Allow valid subdomain patterns where the last part is a TLD
            if (commonTLDs.includes(fourthPart)) {
                return true;
            }
            
            return false;
            }

        if (email.length > 100) {
            return localPart.length > 0 && 
                   domainPart.length > 0 && 
                   domainPart.includes('.') &&
                   !localPart.startsWith('.') && 
                   !localPart.endsWith('.') &&
                   !domainPart.startsWith('.') && 
                   !domainPart.endsWith('.') &&
                   !localPart.includes('..') &&
                   !domainPart.includes('..') &&
                   !domainPart.startsWith('-') &&
                   !domainPart.endsWith('-');
        }
        
        
        // Regex validation for emails
        return emailRegex.test(email);
    }

    private handleEmailChange(e: Event) {
        const target = e.target as HTMLInputElement;
        const newEmail = target.value;
        const isValid = this.validateEmail(newEmail);
        this.setState({ 
            email: newEmail, 
            isEmailValid: isValid 
        });
    }

    private validatePassword(password: string): boolean {
        // Must be at least 6 characters and no more than 20
        if (password.length < 6 || password.length > 20) {
            return false;
        }
        
        // Must not contain spaces
        if (password.includes(' ')) {
            return false;
        }
        
        // Must have at least 1 uppercase letter
        if (!/[A-Z]/.test(password)) {
            return false;
        }
        
        // Must have at least 1 lowercase letter
        if (!/[a-z]/.test(password)) {
            return false;
        }
        
        // Must have at least 1 number
        if (!/\d/.test(password)) {
            return false;
        }
        
        return true;
    }

    private handlePasswordChange(e: Event) {
        const target = e.target as HTMLInputElement;
        const newPassword = target.value;
        const isValid = this.validatePassword(newPassword);

        // Update password requirements visibility
        const requirementsElement = this.element.querySelector('#password_requirements') as HTMLElement;
        if (requirementsElement) {
            if (newPassword.length > 0) {
                requirementsElement.style.opacity = isValid ? '0.3' : '0.8';
                requirementsElement.style.color = isValid ? '#4CAF50' : '#A260ED';
            } else {
                requirementsElement.style.opacity = '0.7';
                requirementsElement.style.color = '#A260ED';
            }
        }
        
        this.setState({ 
            password: newPassword, 
            isPasswordValid: isValid,
            isConfirmPasswordValid: newPassword === this.state.confirmPassword
        });
    }

    private handleConfirmPasswordChange(e: Event) {
        const target = e.target as HTMLInputElement;
        const newConfirmPassword = target.value;
        const isValid = newConfirmPassword === this.state.password;
       this.setState({ 
            confirmPassword: newConfirmPassword, 
            isConfirmPasswordValid: isValid 
        });
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

    private async loadGoogleScript(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (window.google) {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://accounts.google.com/gsi/client';
            script.async = true;
            script.defer = true;
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('Failed to load Google SDK'));
            document.head.appendChild(script);
        });
    }

    private async initializeGoogleAuth(): Promise<void> {
        try {
            await this.loadGoogleScript();

            if (!window.google) {
                throw new Error('Google SDK not loaded');
            }

            window.handleGoogleCredentialResponse = this.handleCredentialResponse.bind(this);

            window.google.accounts.id.initialize({
                client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
                callback: window.handleGoogleCredentialResponse,
                auto_select: false,
                cancel_on_tap_outside: true,
                context: 'signup',
                ux_mode: 'popup',
                use_fedcm_for_prompt: false
            });

            console.log('Google Auth initialized successfully for signup');

        } catch (error) {
            console.error('Failed to initialize Google Auth:', error);
            this.showError('Failed to initialize Google Sign-up');
        }
    }

    private async handleCredentialResponse(response: any): Promise<void> {
        try {
            console.log('Google credential response received for signup');

            const result = await authService.googleSignup(response.credential);
            console.log('Google signup result:', result);

            if (result.success) {
                console.log('Google signup successful');
                this.setState({ isGoogleLoading: false });
                
                if (result.message) {
                    console.log('Signup success message:', result.message);
                }
                
                Router.getInstance().navigate("/greatsuccess");
            } else {
                console.error('Google signup failed:', result.error);
                this.setState({ isGoogleLoading: false });
                this.showError(result.error || 'Google Sign-up failed');
            }

        } catch (error) {
            console.error('Google credential response error:', error);
            this.setState({ isGoogleLoading: false });
            
            let errorMessage = 'Google Sign-up failed';
            
            if (error instanceof Error) {
                if (error.message.includes('Invalid') || error.message.includes('401')) {
                    errorMessage = 'Google authentication failed. Please try again or use email/password signup.';
                } else if (error.message.includes('redirect_uri_mismatch') || error.message.includes('400')) {
                    errorMessage = 'Google Sign-up configuration error. Please contact support.';
                } else {
                    errorMessage = error.message;
                }
            }
            
            this.showError(errorMessage);
        }
    }

    private async handleGoogleSignIn(event: Event): Promise<void> {
        event.preventDefault();
        
        if (this.state.isGoogleLoading) return;

        try {
            if (!window.google) {
                await this.initializeGoogleAuth();
            }

            if (!window.google) {
                throw new Error('Google Sign-up not available');
            }

            this.setState({ isGoogleLoading: true });

            // Create a temporary container for Google button (simplified but working approach)
            const tempContainer = document.createElement('div');
            tempContainer.style.position = 'absolute';
            tempContainer.style.left = '-9999px';
            document.body.appendChild(tempContainer);

            // Render Google button
            window.google.accounts.id.renderButton(tempContainer, {
                theme: 'outline',
                size: 'large',
                type: 'standard',
                text: 'signup_with',
                shape: 'rectangular',
                width: 250
            });

            // Auto-click the button after a short delay
            setTimeout(() => {
                const googleButton = tempContainer.querySelector('div[role="button"]') as HTMLElement;
                if (googleButton) {
                    googleButton.click();
                } else {
                    // Fallback to prompt
                    window.google.accounts.id.prompt((notification: any) => {
                        this.setState({ isGoogleLoading: false });
                        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
                            this.showError('Google Sign-up was cancelled or not available.');
                        }
                    });
                }
                
                setTimeout(() => {
                    if (document.body.contains(tempContainer)) {
                        document.body.removeChild(tempContainer);
                    }
                }, 1000);
            }, 100);

        } catch (error) {
            console.error('Google Sign-up error:', error);
            this.setState({ isGoogleLoading: false });
            this.showError('Google Sign-up not available. Please check your internet connection.');
        }
    }

    public async handleSignUp(e: Event) {
        e.preventDefault();
        
        if (!this.state.isEmailValid) {
            this.showError('Please enter a valid email address');
            return;
        }
        
        if (!this.state.isPasswordValid) {
            this.showError('Password must be 6-20 characters, contain at least 1 uppercase letter, 1 lowercase letter, and 1 number');
            return;
        }
        
        if (!this.state.isConfirmPasswordValid) {
            this.showError('Confirm password must match the password');
            return;
        }
        

        try {
            console.log('Sending signup request via authService...');
            
            const result = await authService.register(this.state.email, this.state.password);
            
            if (result.success) {
                console.log('Registration successful');
                Router.getInstance().navigate("/greatsuccess");
            } else {
                console.error('Registration failed:', result.error);
                this.showError(`Registration failed: ${result.error || 'Unknown error'}`);
            }
            
        } catch (error) {
            console.error('Network error:', error);
            this.showError('Network error: Unable to connect to server');
        }
    }

    public handleSignIn(e: Event) {
        e.preventDefault();
        Router.getInstance().navigate("/signin");
    }

    protected onMount(): void {
        this.bind("#email", "email", { twoWay: true });
        this.bind("#password", "password", { twoWay: true });
        this.bind("#confirm_password", "confirmPassword", { twoWay: true }); 
        this.addEventListener("#signup_form", "submit", this.handleSignUp);
        this.addEventListener("#signin_button", "click", this.handleSignIn);
        this.addEventListener("#google_signin_button", "click", this.handleGoogleSignIn);
        
        // Initialize Google Auth
        this.initializeGoogleAuth();
        
        // Add input event listener for email validation
        const emailElement = this.element.querySelector("#email") as HTMLInputElement;
        if (emailElement) {
            emailElement.addEventListener('input', this.handleEmailChange);
        }
        
        // Add input event listener for password validation
        const passwordElement = this.element.querySelector("#password") as HTMLInputElement;
        if (passwordElement) {
            passwordElement.addEventListener('input', this.handlePasswordChange);
        }

        // Add input event listener for confirm password validation
        const confirmPasswordElement = this.element.querySelector("#confirm_password") as HTMLInputElement;
        if (confirmPasswordElement) {
            confirmPasswordElement.addEventListener('input', this.handleConfirmPasswordChange);
        }

    }

    render() {}
}