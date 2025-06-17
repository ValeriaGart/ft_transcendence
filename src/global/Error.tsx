import { myJSX } from '../util/mini-jsx';

interface ErrorProps {
    message: string;
    type?: 'error' | 'warning' | 'info';
    className?: string;
}

export function Error({ message, type = 'error', className = '' }: ErrorProps) {
    // Define colors based on error type
    const colors = {
        error: 'text-red-500',
        warning: 'text-yellow-500',
        info: 'text-blue-500'
    };

    // Combine base classes with custom className
    const baseClasses = 'text-center text-sm';
    const colorClass = colors[type];
    const finalClasses = `${baseClasses} ${colorClass} ${className}`.trim();

    return (
        <div class={finalClasses}>
            {message}
        </div>
    );
} 