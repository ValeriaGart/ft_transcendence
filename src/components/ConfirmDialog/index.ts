import { Component } from "@blitz-ts/Component";

interface ConfirmDialogProps {
    message: string;
    onConfirm?: () => void;
    onCancel?: () => void;
}

interface ConfirmDialogState {
    message: string;
    isVisible: boolean;
}

export class ConfirmDialogManager {
    private static currentConfirmComponent: ConfirmDialog | null = null;

    static showConfirm(message: string, parentElement: HTMLElement, onConfirm?: () => void, onCancel?: () => void): void {
        this.removeConfirm();

        const confirmComponent = new ConfirmDialog({
            message: message,
            onConfirm: () => {
                this.removeConfirm();
                if (onConfirm) {
                    onConfirm();
                }
            },
            onCancel: () => {
                this.removeConfirm();
                if (onCancel) {
                    onCancel();
                }
            }
        });
        
        // Mount confirm component to the parent element
        confirmComponent.mount(parentElement);
        
        // Store reference to remove later
        this.currentConfirmComponent = confirmComponent;
    }

    /**
     * Removes the current confirm component if it exists
     */
    static removeConfirm(): void {
        if (this.currentConfirmComponent) {
            this.currentConfirmComponent.unmount();
            this.currentConfirmComponent = null;
        }
    }
}

export class ConfirmDialog extends Component<ConfirmDialogProps, ConfirmDialogState> {
    protected static state: ConfirmDialogState = {
        message: "",
        isVisible: true,
    };

    constructor(props: ConfirmDialogProps) {
        super(props);
        this.setState({
            message: props.message,
            isVisible: true
        });
    }

    protected onMount(): void {
        // Update the text immediately after mount
        this.updateConfirmText();

        this.addEventListener("#confirm_yes_button", "click", () => {
            this.setState({ isVisible: false });
            if (this.props.onConfirm) {
                this.props.onConfirm();
            }
        });

        this.addEventListener("#confirm_no_button", "click", () => {
            this.setState({ isVisible: false });
            if (this.props.onCancel) {
                this.props.onCancel();
            }
        });
    }

    private updateConfirmText() {
        const confirmText = this.element.querySelector("p") as HTMLElement;
        if (confirmText) {
            confirmText.textContent = this.state.message;
        } else {
            console.log('Could not find confirm text element');
        }
    }

    render() {      
        if (!this.state.isVisible) {
            this.element.style.display = 'none';
            return;
        }

        this.updateConfirmText();
    }
} 