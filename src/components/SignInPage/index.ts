import { Component } from "@blitz-ts/Component";
import { Router } from "@blitz-ts/router";
import { ErrorManager } from "../Error";
import { authService } from "../../lib/auth";
import { COMMON_TLDS, VALID_COUNTRY_TLDS } from "../../utils/emailTLDs";

interface SignInPageState {
    email: string;
    password: string;
    showError: boolean;
    errorMessage: string | null;
    isGoogleLoading: boolean;
}

declare global {
  interface Window {
    google: any;
    handleGoogleCredentialResponse: (response: any) => void;
  }
}

export class SignInPage extends Component<SignInPageState> {

    protected static state: SignInPageState = {
        email: "",
        password: "",
        showError: false,
        errorMessage: null,
        isGoogleLoading: false,
    }

    constructor() {
        super();
        this.handleSignIn = this.handleSignIn.bind(this);
        this.handleGoogleSignIn = this.handleGoogleSignIn.bind(this);
        this.initializeGoogleAuth = this.initializeGoogleAuth.bind(this);
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
        
        // Handle 2-part domains (e.g., example.com)
        if (domainParts.length === 2) {
            const secondPart = domainParts[1];
            // Check if the second part is a valid TLD
            if (!COMMON_TLDS.includes(secondPart)) {
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
            if (COMMON_TLDS.includes(secondPart) && COMMON_TLDS.includes(thirdPart)) {
                return false;
            }
            
            // Allow valid subdomain patterns: sub.example.com, mail.example.org
            if (COMMON_TLDS.includes(thirdPart)) {
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
            
            // Check if the last three parts form a valid pattern: example.co.uk
            
            const lastTwoParts = thirdPart + '.' + fourthPart;
            
            // If the last two parts form a valid country TLD, this is a valid subdomain
            if (validCountryTLDs.includes(lastTwoParts)) {
                return true;
            }
            
            // Check for invalid double TLD patterns in the last three parts
            if (COMMON_TLDS.includes(thirdPart) && COMMON_TLDS.includes(fourthPart)) {
                return false;
            }
            
            // Allow valid subdomain patterns where the last part is a TLD
            if (COMMON_TLDS.includes(fourthPart)) {
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
        
        // Regex validation for shorter emails
        return emailRegex.test(email);
    }

    public async handleSignIn(e: Event) {
        e.preventDefault();
        
        if (!this.state.email || !this.state.password) {
            this.showError('Please enter both email and password');
            return;
        }

        try {
            console.log('Attempting login...');
            
            const result = await authService.login(this.state.email, this.state.password);
            
            if (result.success) {
                console.log('Login successful, redirecting to user page');
                // Login successful, navigate to user page
                Router.getInstance().navigate("/greatsuccess");
            } else {
                console.error('Login failed:', result.error);
                this.showError(result.error || 'Login failed');
            }
            
        } catch (error) {
            console.error('Network error:', error);
            this.showError('Network error: Unable to connect to server');
        }
    }

    public handleSignUp(e: Event) {
        e.preventDefault();
        Router.getInstance().navigate("/signup");
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
                client_id: '921980179970-65l8tisfd4qls4497e846eg7mbj96lhg.apps.googleusercontent.com',
                callback: window.handleGoogleCredentialResponse,
                auto_select: false,
                cancel_on_tap_outside: true,
                context: 'signin',
                ux_mode: 'popup',
                use_fedcm_for_prompt: false
            });

            console.log('Google Auth initialized successfully');

        } catch (error) {
            console.error('Failed to initialize Google Auth:', error);
            this.showError('Failed to initialize Google Sign-in');
        }
    }

    private async handleCredentialResponse(response: any): Promise<void> {
        try {
            console.log('Google credential response received for signin');

            const result = await authService.googleSignin(response.credential);
            console.log('Google signin result:', result);

            if (result.success) {
                console.log('Google signin successful');
                this.setState({ isGoogleLoading: false });
                Router.getInstance().navigate("/greatsuccess");
            } else {
                console.error('Google signin failed:', result.error);
                this.setState({ isGoogleLoading: false });
                this.showError(result.error || 'Google signin failed');
            }

        } catch (error) {
            console.error('Google credential response error:', error);
            this.setState({ isGoogleLoading: false });
            
            let errorMessage = 'Google Sign-in failed';
            
            if (error instanceof Error) {
                if (error.message.includes('Invalid') || error.message.includes('401')) {
                    errorMessage = 'Google authentication failed. Please try again or use email/password login.';
                } else if (error.message.includes('redirect_uri_mismatch') || error.message.includes('400')) {
                    errorMessage = 'Google Sign-in configuration error. Please contact support.';
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
                throw new Error('Google Sign-in not available');
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
                text: 'signin_with',
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
                            this.showError('Google Sign-in was cancelled or not available.');
                        }
                    });
                }
                
                // Clean up the temporary container
                setTimeout(() => {
                    if (document.body.contains(tempContainer)) {
                        document.body.removeChild(tempContainer);
                    }
                }, 1000);
            }, 100);

        } catch (error) {
            console.error('Google Sign-in error:', error);
            this.setState({ isGoogleLoading: false });
            this.showError('Google Sign-in not available. Please check your internet connection.');
        }
    }



    protected onMount(): void {
        this.bind("#email", "email", { twoWay: true });
        this.bind("#password", "password", { twoWay: true });
        this.addEventListener("#signin_form", "submit", this.handleSignIn);
        this.addEventListener("#signup_button", "click", this.handleSignUp);
        this.addEventListener("#google_signin_button", "click", this.handleGoogleSignIn);
        
        this.initializeGoogleAuth();
    }

    render() {}
}