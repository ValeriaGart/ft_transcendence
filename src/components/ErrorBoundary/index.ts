import { Component } from "@blitz-ts/Component";

interface ErrorBoundaryProps {
    fallback?: (error: Error, errorInfo: any) => HTMLElement;
    onError?: (error: Error, errorInfo: any) => void;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
    errorInfo: any;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    protected static state: ErrorBoundaryState = {
        hasError: false,
        error: null,
        errorInfo: null,
    };

    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.handleError = this.handleError.bind(this);
        this.setupErrorListeners();
    }

    private setupErrorListeners(): void {
        
        window.addEventListener('error', (event) => {
            this.handleError(event.error, {
                type: 'window.error',
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno
            });
        });

        window.addEventListener('unhandledrejection', (event) => {
            console.log('ErrorBoundary caught unhandledrejection event:', event);
            this.handleError(new Error(event.reason), {
                type: 'unhandledrejection',
                promise: event.promise
            });
        });
    }

    private handleError(error: Error, errorInfo: any) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
        
        this.setState({
            hasError: true,
            error: error,
            errorInfo: errorInfo
        });

        this.render();
        if (this.props.onError) {
            this.props.onError(error, errorInfo);
        }
    }

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                const fallbackElement = this.props.fallback(this.state.error!, this.state.errorInfo);
                this.element.innerHTML = '';
                this.element.appendChild(fallbackElement);
            } else {
                this.element.innerHTML = `
                    <div class="fixed inset-0 flex items-center justify-center z-50 bg-red-100">
                        <div class="bg-white border border-[#EF7D77] rounded-lg p-6 max-w-md mx-4">
                            <h2 class="text-[#EF7D77] text-lg font-['Irish_Grover'] mb-4">Something went wrong</h2>
                            <p class="text-gray-700 mb-4">An error occurred while rendering this component.</p>
                            <details class="text-sm text-gray-600">
                                <summary class="cursor-pointer mb-2">Error Details</summary>
                                <pre class="bg-gray-100 p-2 rounded text-xs overflow-auto">${this.state.error?.message || this.state.error?.stack || 'Unknown error'}</pre>
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