import { Component } from "@blitz-ts/Component";

interface SignUpPageState {
    email: string;
    password: string;
    confirmPassword: string;
}

export class SignUpPage extends Component<SignUpPageState> {
    protected static state: SignUpPageState = {
        email: "",
        password: "",
        confirmPassword: "",
    };

    constructor() {
        super();
        this.handleSignUp = this.handleSignUp.bind(this);
    }

    public handleSignUp(e: Event) {
        e.preventDefault();
        console.log(this.state.email);
    }


    protected onMount(): void {
        this.bind("#email", "email", { twoWay: true });
        this.bind("#password", "password", { twoWay: true });
        this.bind("#confirm_password", "confirmPassword", { twoWay: true }); 
        this.addEventListener("#signup_form", "submit", this.handleSignUp);
    }

    render() {
     console.log(this.state);
    }
}