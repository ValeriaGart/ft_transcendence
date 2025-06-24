import { Component } from "@blitz-ts/Component";

// Step 1: Define what properties the ErrorBoundary can accept
interface ErrorBoundaryProps {
    // Optional function to create custom error UI
    fallback?: (error: Error, errorInfo: any) => HTMLElement;
    // Optional function to handle errors (for logging, etc.)
    onError?: (error: Error, errorInfo: any) => void;
}

// Step 2: Define the internal state of the ErrorBoundary
interface ErrorBoundaryState {
    hasError: boolean;      // Do we have an error?
    error: Error | null;    // What error occurred?
    errorInfo: any;         // Additional error information
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    // Step 4: Define the initial state
    protected static state: ErrorBoundaryState = {
        hasError: false,
        error: null,
        errorInfo: null,
    };

    // Step 5: Constructor
    constructor(props: ErrorBoundaryProps) {
        super(props);
        // Bind the error handler to this component
        this.handleError = this.handleError.bind(this);
        this.setupErrorListeners();
    }

    private setupErrorListeners(): void {
        console.log('ErrorBoundary setting up event listeners...');
        
        // Listen for JavaScript errors
        window.addEventListener('error', (event) => {
            console.log('ErrorBoundary caught window.error event:', event);
            this.handleError(event.error, {
                type: 'window.error',
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno
            });
        });

        // Listen for unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            console.log('ErrorBoundary caught unhandledrejection event:', event);
            this.handleError(new Error(event.reason), {
                type: 'unhandledrejection',
                promise: event.promise
            });
        });
        
        console.log('ErrorBoundary event listeners set up');
    }
    // Step 6: Method to handle errors
    private handleError(error: Error, errorInfo: any) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
        
        // Update the state to show we have an error
        this.setState({
            hasError: true,
            error: error,
            errorInfo: errorInfo
        });

        this.render();
        console.log("ErrorBoundary caught and rendered error:", error, errorInfo);
        // Call the onError callback if provided
        if (this.props.onError) {
            this.props.onError(error, errorInfo);
        }
    }

    // Step 7: Set up error listeners when component mounts
    protected onMount(): void {
        console.log('ErrorBoundary onMount called');
    }
    // Step 8: Render method - show error UI if there's an error
    render() {
        if (this.state.hasError) {
            // We have an error - show fallback UI
            if (this.props.fallback) {
                // Use custom fallback if provided
                const fallbackElement = this.props.fallback(this.state.error!, this.state.errorInfo);
                this.element.innerHTML = '';
                this.element.appendChild(fallbackElement);
            } else {
                // Use default error UI
                this.element.innerHTML = `
                    <div class="fixed inset-0 flex items-center justify-center z-50 bg-red-100">
                        <div class="bg-white border border-[#EF7D77] rounded-lg p-6 max-w-md mx-4">
                            <h2 class="text-[#EF7D77] text-lg font-['Irish_Grover'] mb-4">Something went wrong</h2>
                            <p class="text-gray-700 mb-4">An error occurred while rendering this component.</p>
                            <details class="text-sm text-gray-600">
                                <summary class="cursor-pointer mb-2">Error Details</summary>
                                <pre class="bg-gray-100 p-2 rounded text-xs overflow-auto">${this.state.error?.stack || this.state.error?.message || 'Unknown error'}</pre>
                            </details>
                            <button onclick="window.location.reload()" class="mt-4 bg-[#EF7D77] font-['Irish_Grover'] text-white px-4 py-2 rounded hover:bg-red-600">
                                Reload Page
                            </button>
                        </div>
                    </div>
                `;
            }
        }
    }
}