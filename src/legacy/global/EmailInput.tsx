import { myJSX } from '../util/mini-jsx';
import { useState } from '../util/state/state';
import { Error } from './Error';

interface EmailInputProps {
    value: string;
    onChange: (email: string, isValid: boolean) => void;
    className?: string;
    placeholder?: string;
    textColor?: string;
    placeholderColor?: string;
}

export function EmailInput({ 
    value, 
    onChange, 
    className = '', 
    placeholder = 'Email',
    textColor = '#B784F2',
    placeholderColor = 'purple-400'
}: EmailInputProps) {
    const [error, setError] = useState('');

    const validateEmail = (email: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const handleEmailChange = (e: Event) => {
        const newEmail = (e.target as HTMLInputElement).value;
        console.log('Email changed:', newEmail); // Debug log
        
        if (!newEmail) {
            setError('Email is required');
            onChange(newEmail, false);
        } else if (!validateEmail(newEmail)) {
            setError('Please enter a valid email');
            onChange(newEmail, false);
        } else {
            setError('');
            onChange(newEmail, true);
        }
    };

    return (
        <div class={`flex flex-col gap-2 ${className}`}>
            <input
                type="email"
                placeholder={placeholder}
                value={value}
                onChange={handleEmailChange}
                class={`p-1 pl-2 focus:outline-0 text-[${textColor}] placeholder-${placeholderColor}`}
            />
            {error && <Error message={error} />}
        </div>
    );
} 