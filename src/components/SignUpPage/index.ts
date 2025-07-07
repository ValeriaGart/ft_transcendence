import { Component } from "@blitz-ts/Component";
import { Router } from "@blitz-ts/router";
import { Error as ErrorComponent } from "../Error";
import { authService } from "../../lib/auth";

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

    private currentErrorComponent: ErrorComponent | null = null;

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
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    private handleEmailChange(e: Event) {
        const target = e.target as HTMLInputElement;
        const newEmail = target.value;
        const isValid = this.validateEmail(newEmail);
        
        console.log('Email changed:', { newEmail, isValid });
        
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
        
        console.log('Password changed:', { newPassword, isValid });
        
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
        
        console.log('Confirm Password changed:', { newConfirmPassword, isValid });
        
        this.setState({ 
            confirmPassword: newConfirmPassword, 
            isConfirmPasswordValid: isValid 
        });
    }

    private showError(message: string) {
        this.setState({
            errorMessage: message,
            showError: true
        });
        
        // Create and mount the error component immediately
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

            const result = await authService.googleLogin(response.credential);
            console.log('Google signup result:', result);

            if (result.success) {
                console.log('Google signup successful');
                this.setState({ isGoogleLoading: false });
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
                
                // Clean up the temporary container
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
            console.log('Please enter a valid email address');
            return;
        }
        
        if (!this.state.isPasswordValid) {
            this.showError('Password must be longer than 6 and shorter than 20 characters and contain at least 1 number');
            console.log('Password must be longer than 6 and shorter than 20 characters and contain at least 1 number');
            return;
        }
        
        if (!this.state.isConfirmPasswordValid) {
            this.showError('Confirm password must match the password');
            console.log('Confirm password must match the password');
            return;
        }
        

        try {
            console.log('Sending signup request to backend...');
            
            const response = await fetch('http://localhost:3000/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: this.state.email,
                    passwordString: this.state.password
                })
            });
            
            console.log('Response status:', response.status);
            
            if (!response.ok) {
                const errorData = await response.json();
                console.error('Backend error:', errorData);
                this.showError(`Registration failed: ${errorData.error || 'Unknown error'}`);
                return;
            }
            
            const data = await response.json();
            console.log('Registration successful:', data);
            
            // Registration successful, navigate to success page
            Router.getInstance().navigate("/greatsuccess");
            
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

    render() {
        console.log(this.state);
    }
}