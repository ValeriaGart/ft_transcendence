import { Component } from "@blitz-ts/Component";

interface MatchHistoryComponentState {
  error: string | null;
}

export class MatchHistoryComponent extends Component<MatchHistoryComponentState> {
  protected static state: MatchHistoryComponentState = {
    error: null,
  }

  constructor() {
    super();
  }

  render() {}
}