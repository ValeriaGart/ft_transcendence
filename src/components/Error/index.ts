import { Component } from "@blitz-ts/Component";

interface ErrorProps {
    message: string;
    onClose?: () => void;
}

interface ErrorState {
    message: string;
    isVisible: boolean;
}

export class Error extends Component<ErrorProps, ErrorState> {
    protected static state: ErrorState = {
        message: "",
        isVisible: true,
    };

    constructor(props: ErrorProps) {
        super(props);
        this.setState({
            message: props.message,
            isVisible: true
        });
    }

    protected onMount(): void {
        console.log('Error component onMount called, message:', this.state.message);
        
        // Update the text immediately after mount
        this.updateErrorText();

        this.addEventListener("#close_error_button", "click", () => {
            this.setState({ isVisible: false });
            if (this.props.onClose) {
                this.props.onClose();
            }
        });
    }

    private updateErrorText() {
        const errorText = this.element.querySelector("p") as HTMLElement;
        if (errorText) {
            errorText.textContent = this.state.message;
            console.log('Updated error text to:', errorText.textContent);
        } else {
            console.log('Could not find error text element');
        }
    }

    render() {
        console.log('Error component render called, isVisible:', this.state.isVisible, 'message:', this.state.message);
        
        if (!this.state.isVisible) {
            this.element.style.display = 'none';
            return;
        }

        this.updateErrorText();
    }
}
