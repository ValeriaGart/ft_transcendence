import { myJSX } from '../util/mini-jsx';
import { SoundButton } from '../global/SoundButton';
import { GoogleSignInButton } from '../global/GoogleSignInButton';
import { useState } from '../util/state/state';
import { EmailInput } from '../global/EmailInput';
import { PasswordInput } from '../global/PasswordInput';
import { Error } from '../global/Error';

interface SignupPageProps {
    onEnterClick: () => void;
}

export function SignupPage({ onEnterClick }: SignupPageProps) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isEmailValid, setIsEmailValid] = useState(false);
    const [isPasswordValid, setIsPasswordValid] = useState(false);
    const [isConfirmPasswordValid, setIsConfirmPasswordValid] = useState(false);
    const [apiError, setApiError] = useState('');

    const handleEmailChange = (newEmail: string, isValid: boolean) => {
        console.log('SignupPage: Email changed', { newEmail, isValid }); // Debug log
        setEmail(newEmail);
        setIsEmailValid(isValid);
        setApiError(''); // Clear any previous API errors
    };

    const handlePasswordChange = (newPassword: string, isValid: boolean) => {
        console.log('SignupPage: Password changed', { newPassword, isValid }); // Debug log
        setPassword(newPassword);
        setIsPasswordValid(isValid);
        // Update confirm password validation
        setIsConfirmPasswordValid(newPassword === confirmPassword);
        setApiError(''); // Clear any previous API errors
    };

    const handleConfirmPasswordChange = (e: ChangeEvent<HTMLInputElement>) => {
        const newConfirmPassword = e.target.value;
        console.log('SignupPage: Confirm password changed', { newConfirmPassword }); // Debug log
        setConfirmPassword(newConfirmPassword);
        setIsConfirmPasswordValid(newConfirmPassword === password);
        setApiError(''); // Clear any previous API errors
    };

    const handleGoogleSuccess = (user: any) => {
        console.log('Google Sign-in successful during signup:', user);
        onEnterClick(); // Navigate to the game
    };

    const handleGoogleError = (error: string) => {
        console.error('Google Sign-in error during signup:', error);
        setApiError(error);
    };

    const handleClick = async () => {
        console.log('Form validation:', { isEmailValid, isPasswordValid, isConfirmPasswordValid }); // Debug log
        
        if (!isEmailValid || !isPasswordValid || !isConfirmPasswordValid) {
            console.log('Form validation failed');
            return;
        }

        try {
            console.log('Attempting registration with:', { email, password });
            const response = await fetch('http://localhost:3000/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    email, 
                    passwordString: password
                }),
            });

            console.log('Response status:', response.status);
            console.log('Response headers:', Object.fromEntries(response.headers.entries()));

            const responseText = await response.text();
            console.log('Raw response:', responseText);

            if (!response.ok) {
                let errorMessage = 'Registration failed';
                try {
                    const errorData = JSON.parse(responseText);
                    // Check for duplicate email error
                    if (errorData.details?.includes('UNIQUE constraint failed: users.email')) {
                        errorMessage = 'This email is already registered. Please use a different email or try logging in.';
                    } else {
                        errorMessage = errorData.message || errorMessage;
                    }
                } catch (e) {
                    console.error('Error parsing error response:', e);
                }
                setApiError(errorMessage);
                return;
            }

            console.log('Registration successful');
            // Call onEnterClick to navigate to the next screen
            onEnterClick();
        } catch (error) {
            console.error('Registration error:', error);
            setApiError('Failed to connect to the server. Please try again.');
        }
    };

    return (
        <div id="signup_page" class="absolute top-[49%] left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[37%]">
            <img src="/art/signin_up/Backsignup.svg" alt="Back4" class="h-full w-full object-fill" />
            <SoundButton position={{ bottom: '4', right: '4' }} />
            <div class="absolute flex flex-col top-[39%] left-[30%] text-[90%] xl:text-[110%] 2xl:text-[120%] gap-y-3 xl:gap-y-[1.1vw] 2xl:gap-y-[1.4vw]">
                <EmailInput
                    value={email}
                    onChange={handleEmailChange}
                    textColor="#B784F2"
                    placeholderColor="purple-400"
                    className="w-full"
                />
                <PasswordInput
                    value={password}
                    onChange={handlePasswordChange}
                    textColor="#B784F2"
                    placeholderColor="purple-400"
                    className="w-full"
                />
                <div class="flex flex-col w-full">
                    <input
                        type="password"
                        placeholder="Confirm Password"
                        value={confirmPassword}
                        onChange={handleConfirmPasswordChange}
                        class="p-1 pl-2 focus:outline-0 text-[#B784F2] placeholder-purple-400"
                    />
                    {!isConfirmPasswordValid && confirmPassword && (
                        <Error message="Passwords do not match" />
                    )}
                </div>
                {apiError && (
                    <div>
                        <Error message={apiError} />
                    </div>
                )}
            </div>

            <div 
                onClick={handleClick} 
                class={`absolute top-[40%] left-[0.3%] w-auto cursor-pointer ${isEmailValid && isPasswordValid && isConfirmPasswordValid ? 'hover:opacity-80' : 'opacity-50'}`}
            >
                <img 
                    src="/art/signin_up/enter_button2.svg" 
                    alt="Enter" 
                    class="h-[9vw] w-auto min-h-25 max-h-35" 
                />
            </div>
            
            {/* Google Sign-in Button */}
            <div class="absolute top-[70%] left-1/2 transform -translate-x-1/2">
                <GoogleSignInButton 
                    onSuccess={handleGoogleSuccess}
                    onError={handleGoogleError}
                    className="h-[6vw] w-auto min-h-20 max-h-25"
                />
            </div>
        </div>
    );
}
