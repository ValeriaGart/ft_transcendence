import { Component } from "@blitz-ts/Component";

interface ErrorProps {
    message: string;
    onClose?: () => void;
}

interface ErrorState {
    message: string;
    isVisible: boolean;
}

// Static utility class for managing error components across the application
export class ErrorManager {
    private static currentErrorComponent: Error | null = null;

    /**
     * Shows an error message by creating and mounting an Error component
     * @param message - The error message to display
     * @param parentElement - The parent element to mount the error component to
     * @param onClose - Optional callback when the error is closed
     */
    static showError(message: string, parentElement: HTMLElement, onClose?: () => void): void {
        // Remove any existing error component first
        this.removeError();

        const errorComponent = new Error({
            message: message,
            onClose: () => {
                this.removeError();
                if (onClose) {
                    onClose();
                }
            }
        });
        
        // Mount error component to the parent element
        errorComponent.mount(parentElement);
        
        // Store reference to remove later
        this.currentErrorComponent = errorComponent;
    }

    /**
     * Removes the current error component if it exists
     */
    static removeError(): void {
        if (this.currentErrorComponent) {
            this.currentErrorComponent.unmount();
            this.currentErrorComponent = null;
        }
    }

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
