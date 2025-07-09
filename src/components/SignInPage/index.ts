import { Component } from "@blitz-ts/Component";
import { Router } from "@blitz-ts/router";
import { Error as ErrorComponent } from "../Error";
import { authService } from "../../lib/auth";

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

    private currentErrorComponent: ErrorComponent | null = null;

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
        this.removeErrorComponent();

        const errorComponent = new ErrorComponent({
            message: message,
            onClose: () => this.hideError()
        });
        
        errorComponent.mount(this.element);
        
        this.currentErrorComponent = errorComponent;
    }

    private removeErrorComponent() {
        if (this.currentErrorComponent) {
            this.currentErrorComponent.unmount();
            this.currentErrorComponent = null;
        }
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
            console.log('Google credential response received');

            const result = await authService.googleLogin(response.credential);
            console.log('Google login result:', result);

            if (result.success) {
                console.log('Google login successful');
                this.setState({ isGoogleLoading: false });
                Router.getInstance().navigate("/greatsuccess");
            } else {
                console.error('Google login failed:', result.error);
                this.setState({ isGoogleLoading: false });
                this.showError(result.error || 'Google login failed');
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