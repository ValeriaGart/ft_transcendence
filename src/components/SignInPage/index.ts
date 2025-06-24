import { Component } from "@blitz-ts/Component";
import { Router } from "@blitz-ts/router";
import { Error } from "../Error";

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

    public async handleSignIn(e: Event) {
        e.preventDefault();
        
        if (!this.state.email || !this.state.password) {
            this.showError('Please enter both email and password');
            return;
        }

        try {
            console.log('Sending signin request to backend...');
            
            const response = await fetch('/api/users/login', {
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
                this.showError(` ${errorData.error || 'Invalid email or password'}`);
                return;
            }
            
            const data = await response.json();
            console.log('Login successful:', data);
            
            // Login successful, navigate to success page
            Router.getInstance().navigate("/auth/greatsuccess");
            
        } catch (error) {
            console.error('Network error:', error);
            this.showError('Network error: Unable to connect to server');
        }
    }

    protected onMount(): void {
        this.bind("#email", "email", { twoWay: true });
        this.bind("#password", "password", { twoWay: true });
        this.addEventListener("#signin_form", "submit", this.handleSignIn);
    }

    render() {}
}