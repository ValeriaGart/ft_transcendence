import { Component } from "@blitz-ts/Component";
import { Router } from "@blitz-ts/router";
import { ErrorManager } from "../Error";
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
    protected static state: SignUpPageState = {
        email: "",
        password: "",
        confirmPassword: "",
        isEmailValid: false,
        isPasswordValid: false,
        showError: false,
        isConfirmPasswordValid: false,
        errorMessage: null,
        isGoogleLoading: false
    };

    private emailChangeHandler: (e: Event) => void;
    private passwordChangeHandler: (e: Event) => void;
    private confirmPasswordChangeHandler: (e: Event) => void;
    private emailElement: HTMLInputElement | null = null;
    private passwordElement: HTMLInputElement | null = null;
    private confirmPasswordElement: HTMLInputElement | null = null;

    constructor() {
        super();
        this.emailChangeHandler = this.handleEmailChange.bind(this);
        this.passwordChangeHandler = this.handlePasswordChange.bind(this);
        this.confirmPasswordChangeHandler = this.handleConfirmPasswordChange.bind(this);
    }

    private validateEmail(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    private handleEmailChange(e: Event) {
        const target = e.target as HTMLInputElement;
        const email = target.value;
        this.setState({
            email: email,
            isEmailValid: this.validateEmail(email)
        });
    }

    private validatePassword(password: string): boolean {
        // Password must be 6-20 characters, contain at least 1 uppercase letter, 1 lowercase letter, and 1 number
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{6,20}$/;
        return passwordRegex.test(password);
    }

    private handlePasswordChange(e: Event) {
        const target = e.target as HTMLInputElement;
        const password = target.value;
        this.setState({
            password: password,
            isPasswordValid: this.validatePassword(password)
        });
    }

    private handleConfirmPasswordChange(e: Event) {
        const target = e.target as HTMLInputElement;
        const confirmPassword = target.value;
        this.setState({
            confirmPassword: confirmPassword,
            isConfirmPasswordValid: confirmPassword === this.state.password
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
            script.onerror = () => reject(new Error('Failed to load Google script'));
            document.head.appendChild(script);
        });
    }

    private async initializeGoogleAuth(): Promise<void> {
        try {
            await this.loadGoogleScript();
            
            window.handleGoogleCredentialResponse = async (response: any) => {
                await this.handleCredentialResponse(response);
            };

            window.google.accounts.id.initialize({
                client_id: '1234567890-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com',
                callback: window.handleGoogleCredentialResponse
            });

            window.google.accounts.id.renderButton(
                document.getElementById('google_signin_button')!,
                { theme: 'outline', size: 'large' }
            );

        } catch (error) {
            console.error('Error initializing Google Auth:', error);
        }
    }

    private async handleCredentialResponse(response: any): Promise<void> {
        try {
            console.log('Google credential response received');
            
            const result = await authService.googleSignup(response.credential);
            
            if (result.success) {
                console.log('Google registration successful');
                Router.getInstance().navigate("/greatsuccess");
            } else {
                console.error('Google registration failed:', result.error);
                this.showError(`Google registration failed: ${result.error || 'Unknown error'}`);
            }
            
        } catch (error) {
            console.error('Error handling Google credential:', error);
            this.showError('Failed to process Google sign-in. Please try again.');
        }
    }

    private async handleGoogleSignIn(event: Event): Promise<void> {
        event.preventDefault();
        
        try {
            this.setState({ isGoogleLoading: true });
            
            // Create a temporary container for the Google One Tap prompt
            const tempContainer = document.createElement('div');
            tempContainer.style.position = 'fixed';
            tempContainer.style.top = '0';
            tempContainer.style.left = '0';
            tempContainer.style.width = '100%';
            tempContainer.style.height = '100%';
            tempContainer.style.zIndex = '9999';
            tempContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
            tempContainer.style.display = 'flex';
            tempContainer.style.justifyContent = 'center';
            tempContainer.style.alignItems = 'center';
            
            document.body.appendChild(tempContainer);
            
            // Show loading message
            tempContainer.innerHTML = `
                <div style="background: white; padding: 20px; border-radius: 8px; text-align: center;">
                    <div>Loading Google Sign-in...</div>
                </div>
            `;
            
            // Wait a bit for the container to be added to DOM
            setTimeout(() => {
                if (window.google && window.google.accounts && window.google.accounts.id) {
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
        this.emailElement = this.element.querySelector("#email") as HTMLInputElement;
        if (this.emailElement) {
            this.emailElement.addEventListener('input', this.emailChangeHandler);
        }
        
        // Add input event listener for password validation
        this.passwordElement = this.element.querySelector("#password") as HTMLInputElement;
        if (this.passwordElement) {
            this.passwordElement.addEventListener('input', this.passwordChangeHandler);
        }

        // Add input event listener for confirm password validation
        this.confirmPasswordElement = this.element.querySelector("#confirm_password") as HTMLInputElement;
        if (this.confirmPasswordElement) {
            this.confirmPasswordElement.addEventListener('input', this.confirmPasswordChangeHandler);
        }
    }

    protected onUnmount(): void {
        console.log('SignUpPage onUnmount called');
        
        // Remove manual event listeners
        if (this.emailElement) {
            this.emailElement.removeEventListener('input', this.emailChangeHandler);
            this.emailElement = null;
        }
        
        if (this.passwordElement) {
            this.passwordElement.removeEventListener('input', this.passwordChangeHandler);
            this.passwordElement = null;
        }
        
        if (this.confirmPasswordElement) {
            this.confirmPasswordElement.removeEventListener('input', this.confirmPasswordChangeHandler);
            this.confirmPasswordElement = null;
        }
        
        // Remove any error components
        ErrorManager.removeError();
        
        console.log('SignUpPage cleanup completed');
    }

    render() {
        console.log(this.state);
    }
}