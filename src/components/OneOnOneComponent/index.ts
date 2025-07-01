import { Component } from "@blitz-ts/Component";

interface OneOnOneComponentState {
  error: string | null;
}

export class OneOnOneComponent extends Component<OneOnOneComponentState> {
  protected static state: OneOnOneComponentState = {
    error: null,
  }

  constructor() {
    super();
  }
    
  render() {
    // The template system will automatically handle the rendering
  }
}