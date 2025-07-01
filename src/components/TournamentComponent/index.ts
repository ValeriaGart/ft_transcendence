import { Component } from "@blitz-ts/Component";

interface TournamentComponentState {
  error: string | null;
}

export class TournamentComponent extends Component<TournamentComponentState> {
  protected static state: TournamentComponentState = {
    error: null,
  }

  constructor() {
    super();
  }
    
  render() {
    // The template system will automatically handle the rendering
  }
}