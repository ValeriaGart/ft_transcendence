import { Component } from "@blitz-ts/Component";
import { Router } from "@blitz-ts/router";

interface GreatSuccessPageState {
    timeRemaining: number;
}

export class GreatSuccessPage extends Component<GreatSuccessPageState> {
    protected static state: GreatSuccessPageState = {
        timeRemaining: 3,
    };

    constructor() {
        super();
    }

    protected onMount(): void {
        this.startRedirectTimer();
    }

    private startRedirectTimer(): void {
        const intervalId = setInterval(() => {
            this.setState({
                timeRemaining: this.state.timeRemaining - 0.1
            });

            if (this.state.timeRemaining <= 0) {
                clearInterval(intervalId);
                this.redirectToUserPage();
            }
        }, 100);

        this.addCleanup(() => {
            clearInterval(intervalId);
        });
    }

    private redirectToUserPage(): void {
        console.log('Redirecting to user page...');
        Router.getInstance().navigate("/user");
    }

    render() {}
}