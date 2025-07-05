import { Component } from "@blitz-ts/Component";
import { Router } from "@blitz-ts/router";
import { Error } from "../Error";

interface SignUpPageState {
    email: string;
    password: string;
    confirmPassword: string;
    isEmailValid: boolean;
    isPasswordValid: boolean;
    showError: boolean;
    isConfirmPasswordValid: boolean;
    errorMessage: string | null;
}

export class SignUpPage extends Component<SignUpPageState> {

    private currentErrorComponent: Error | null = null;

    protected static state: SignUpPageState = {
        email: "",
        password: "",
        confirmPassword: "",
        isEmailValid: false,
        isPasswordValid: false,
        isConfirmPasswordValid: false,
        showError: false,
        errorMessage: null,
    };

    constructor() {
        super();
        this.handleSignUp = this.handleSignUp.bind(this);
        this.handleEmailChange = this.handleEmailChange.bind(this);
        this.handlePasswordChange = this.handlePasswordChange.bind(this);
        this.handleConfirmPasswordChange = this.handleConfirmPasswordChange.bind(this);
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

        const errorComponent = new Error({
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
            this.currentErrorComponent.element.remove();
            this.currentErrorComponent = null;
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