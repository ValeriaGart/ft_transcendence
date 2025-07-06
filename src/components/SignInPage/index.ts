import { Component } from "@blitz-ts/Component";
import { Router } from "@blitz-ts/router";
import { Error } from "../Error";
import { authService } from "../../lib/auth";

interface SignInPageState {
    email: string;
    password: string;
    showError: boolean;
    errorMessage: string | null;
}

export class SignInPage extends Component<SignInPageState> {

    private currentErrorComponent: Error | null = null;

    protected static state: SignInPageState = {
        email: "",
        password: "",
        showError: false,
        errorMessage: null,
    }

    constructor() {
        super();
        this.handleSignIn = this.handleSignIn.bind(this);
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

        const errorComponent = new Error({
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

    protected onMount(): void {
        this.bind("#email", "email", { twoWay: true });
        this.bind("#password", "password", { twoWay: true });
        this.addEventListener("#signin_form", "submit", this.handleSignIn);
        this.addEventListener("#signup_button", "click", this.handleSignUp);
    }

    render() {}
}