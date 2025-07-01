import { Component } from "@blitz-ts/Component";

export class UserPage extends Component {

    constructor() {
        super();
        console.log('UserPage constructor called');
    }

    protected onMount(): void {
        console.log('UserPage onMount called');
    }

    render() {
        console.log('UserPage render called');
    }
}