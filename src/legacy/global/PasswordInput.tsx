import { myJSX } from '../util/mini-jsx';
import { useState } from '../util/state/state';
import { Error } from './Error';

interface PasswordInputProps {
    value: string;
    onChange: (password: string, isValid: boolean) => void;
    className?: string;
    placeholder?: string;
    textColor?: string;
    placeholderColor?: string;
}

export function PasswordInput({ 
    value, 
    onChange, 
    className = '', 
    placeholder = 'Password',
    textColor = '#B784F2',
    placeholderColor = 'purple-400'
}: PasswordInputProps) {
    const [error, setError] = useState('');

    const validatePassword = (password: string) => {
        // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
        // Allow special characters
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d\-_@#$%^&*()!]{8,}$/;
        return passwordRegex.test(password);
    };

    const handlePasswordChange = (e: Event) => {
        const newPassword = (e.target as HTMLInputElement).value;
        console.log('Password changed:', newPassword); // Debug log
        
        if (!newPassword) {
            setError('Password is required');
            onChange(newPassword, false);
        } else if (!validatePassword(newPassword)) {
            setError('Password must be at least 8 characters long and contain uppercase, lowercase, and number');
            onChange(newPassword, false);
        } else {
            setError('');
            onChange(newPassword, true);
        }
    };

    return (
        <div class={`flex flex-col gap-2 ${className}`}>
            <input
                type="password"
                placeholder={placeholder}
                value={value}
                onChange={handlePasswordChange}
                class={`p-1 pl-2 focus:outline-0 text-[${textColor}] placeholder-${placeholderColor}`}
            />
            {error && <Error message={error} />}
        </div>
    );
} 