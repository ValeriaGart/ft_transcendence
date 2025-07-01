import { Component } from "@blitz-ts/Component";
import { Router } from "@blitz-ts/router";

interface DashboardComponentState {
  error: string | null;
}

export class DashboardComponent extends Component<DashboardComponentState> {
  protected static state: DashboardComponentState = {
    error: null,
  }

  constructor() {
    super();
  }
    
  render() {
    // The template system will automatically handle the rendering
  }
}