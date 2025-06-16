import { Component } from "@blitz-ts";

export class IndexPage extends Component {
    constructor() {
        super();
    }

    render() {
        // Make sure EntryScreen is visible and ChooseSignInUp is hidden initially
        const entryScreen = document.querySelector('blitz-entry-screen') as HTMLElement;
        const chooseSignInUp = document.querySelector('blitz-choose-sign-in-up') as HTMLElement;
        
        if (entryScreen) {
            entryScreen.style.display = 'block';
        }
        if (chooseSignInUp) {
            chooseSignInUp.style.display = 'none';
        }
    }
}