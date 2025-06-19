import { Component } from "@blitz-ts/Component";

interface SignUpPageState {
    email: string;
    password: string;
    confirmPassword: string;
    isEmailValid: boolean;
    isPasswordValid: boolean;
    isConfirmPasswordValid: boolean;
}

export class SignUpPage extends Component<SignUpPageState> {
    protected static state: SignUpPageState = {
        email: "",
        password: "",
        confirmPassword: "",
        isEmailValid: false,
        isPasswordValid: false,
        isConfirmPasswordValid: false,
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

    public handleSignUp(e: Event) {
        e.preventDefault();
        
        if (!this.state.isEmailValid) {
            console.log('Please enter a valid email address');
            return;
        }
        
        if (!this.state.isPasswordValid) {
            console.log('Password must be longer than 6 and shorter than 20 characters and contain at least 1 number');
            return;
        }
        
        if (!this.state.isConfirmPasswordValid) {
            console.log('Confirm password must match the password');
            return;
        }
        
        console.log(this.state.email);
        console.log(this.state.password);
        console.log(this.state.confirmPassword);
        console.log('hihi');
    }

    protected onMount(): void {
        this.bind("#email", "email", { twoWay: true });
        this.bind("#password", "password", { twoWay: true });
        this.bind("#confirm_password", "confirmPassword", { twoWay: true }); 
        this.addEventListener("#signup_form", "submit", this.handleSignUp);
        
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