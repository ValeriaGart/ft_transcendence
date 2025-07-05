import { Component } from "@blitz-ts/Component";

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
    
  render() {}
}