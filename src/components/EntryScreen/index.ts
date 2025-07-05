import { Component } from "@blitz-ts/Component";
import { Router } from "@blitz-ts/router";

export class EntryScreen extends Component {
    constructor() {
        super();
    }

    render() {
       this.addEventListener("button", "click", ()=>{
        Router.getInstance().navigate("/auth");
       })
    }
}