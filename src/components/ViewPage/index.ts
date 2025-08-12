import { Component } from "@blitz-ts";

interface ViewPageProps {
  nickname?: string;
}

export class ViewPage extends Component<ViewPageProps> {
  constructor(props?: ViewPageProps) {
    super(props);
  }

  protected onMount(): void {
    // no-op for now
  }

  render(): void {
    // ensure child view-profile receives nickname via attribute binding
    const container = this.getElement();
    if (!container) return;
    const comp = container.querySelector('blitz-view-profile-component') as HTMLElement | null;
    if (comp && this.props.nickname) {
      comp.setAttribute('nickname', this.props.nickname);
    }
  }
}


