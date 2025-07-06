import { Component } from "@blitz-ts/Component";
import { Router } from "@blitz-ts/router";

export class AuthPage extends Component {
    constructor() {
        super();
    }

    render() {
        this.addEventListener("#signup_button", "click", () => {
            Router.getInstance().navigate("/signup");
        });
        this.addEventListener("#signin_button", "click", () => {
            Router.getInstance().navigate("/signin");
        });
    }
}