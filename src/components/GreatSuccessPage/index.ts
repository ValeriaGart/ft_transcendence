import { Component } from "@blitz-ts/Component";
import { Router } from "@blitz-ts/router";

interface GreatSuccessPageState {
    timeRemaining: number;
}

export class GreatSuccessPage extends Component<GreatSuccessPageState> {
    private redirectTimer: number | null = null;

    protected static state: GreatSuccessPageState = {
        timeRemaining: 2,
    };

    constructor() {
        super();
    }

    protected onMount(): void {
        console.log('GreatSuccessPage mounted, starting 2-second timer...');
        
        // Start the countdown timer
        this.startRedirectTimer();
    }

    private startRedirectTimer(): void {
        // Set up a timer that fires every 100ms to update the countdown
        const intervalId = setInterval(() => {
            this.setState({
                timeRemaining: this.state.timeRemaining - 0.1
            });

            // When 2 seconds have passed, redirect
            if (this.state.timeRemaining <= 0) {
                clearInterval(intervalId);
                this.redirectToUserPage();
            }
        }, 100);

        // Store the interval ID for cleanup
        this.redirectTimer = intervalId;
    }

    private redirectToUserPage(): void {
        console.log('Redirecting to user page...');
        Router.getInstance().navigate("/user");
    }

    protected onUnmount(): void {
        // Clean up the timer when component unmounts
        if (this.redirectTimer) {
            clearInterval(this.redirectTimer);
            this.redirectTimer = null;
        }
    }

    render() {
        // Optional: You could display the countdown if you want
        // For now, just showing the success page for 2 seconds
    }
}