import { Component } from "@blitz-ts/Component";

interface MatchLogComponentState {
  error: string | null;
}

export class MatchLogComponent extends Component<MatchLogComponentState> {
  protected static state: MatchLogComponentState = {
    error: null,
  }

  constructor() {
    super();
  }
    
  render() {}
}