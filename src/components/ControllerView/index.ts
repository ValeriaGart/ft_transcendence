import { Component } from "@blitz-ts/Component";

type ControllerViewProps = {
    children: Component;
}

export class ControllerView extends Component<ControllerViewProps> {
    constructor(props: ControllerViewProps) {
        super(props);
    }

    render() {}
}