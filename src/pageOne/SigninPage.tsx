import { myJSX } from '../util/mini-jsx';
import { SoundButton } from '../global/SoundButton';
import { GoogleSignInButton } from '../global/GoogleSignInButton';
import { EmailInput } from '../global/EmailInput';
import { PasswordInput } from '../global/PasswordInput';
import { Error } from '../global/Error';
import { useState } from '../util/state/state';
import { loginWithEmailPassword } from '../util/auth/authState';

interface SigninPageProps {
    onEnterClick: () => void;
}

export function SigninPage({ onEnterClick }: SigninPageProps) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isEmailValid, setIsEmailValid] = useState(false);
    const [isPasswordValid, setIsPasswordValid] = useState(false);
    const [apiError, setApiError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleEmailChange = (newEmail: string, isValid: boolean) => {
        setEmail(newEmail);
        setIsEmailValid(isValid);
        setApiError(''); // Clear any previous API errors
    };

    const handlePasswordChange = (newPassword: string, isValid: boolean) => {
        setPassword(newPassword);
        setIsPasswordValid(isValid);
        setApiError(''); // Clear any previous API errors
    };

    const handleGoogleSuccess = (user: any) => {
        console.log('Google Sign-in successful:', user);
        onEnterClick(); // Navigate to the game
    };

    const handleGoogleError = (error: string) => {
        console.error('Google Sign-in error:', error);
        setApiError(error);
    };

    const handleEmailPasswordLogin = async () => {
        if (!isEmailValid || !isPasswordValid) {
            setApiError('Please enter valid email and password');
            return;
        }

        setIsLoading(true);
        setApiError('');

        try {
            await loginWithEmailPassword(email, password);
            onEnterClick(); // Navigate to the game
        } catch (error: any) {
            setApiError(error?.message || 'Login failed');
        } finally {
            setIsLoading(false);
        }
    };

    return myJSX('div', {
        id: 'signin_page',
        class: 'absolute top-[49%] left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[37%]'
    },
        myJSX('img', {
            src: '/art/signin_up/back3.svg',
            alt: 'Back3',
            class: 'h-full w-full object-fill'
        }),
        SoundButton({ position: { bottom: '4', right: '4' } }),
        
        // Email and Password Form
        myJSX('div', {
            class: 'absolute flex flex-col top-[39%] left-[30%] text-[90%] xl:text-[110%] 2xl:text-[120%] gap-y-3 xl:gap-y-[1.1vw] 2xl:gap-y-[1.4vw]'
        },
            EmailInput({
                value: email,
                onChange: handleEmailChange,
                textColor: '#B784F2',
                placeholderColor: 'purple-400',
                className: 'w-full'
            }),
            PasswordInput({
                value: password,
                onChange: handlePasswordChange,
                textColor: '#B784F2',
                placeholderColor: 'purple-400',
                className: 'w-full'
            }),
            apiError ? myJSX('div', {}, Error({ message: apiError })) : null
        ),

        // Email/Password Login Button
        myJSX('div', {
            onClick: handleEmailPasswordLogin,
            class: `absolute top-[40%] right-[0.3%] w-auto cursor-pointer ${
                isEmailValid && isPasswordValid && !isLoading ? 'hover:opacity-80' : 'opacity-50'
            }`
        },
            myJSX('img', {
                src: '/art/signin_up/enter_button.svg',
                alt: 'Enter',
                class: 'h-[8vw] w-auto min-h-25 max-h-35'
            })
        ),

        // Google Sign-in Button
        myJSX('div', {
            class: 'absolute top-[65%] left-1/2 transform -translate-x-1/2'
        },
            GoogleSignInButton({
                onSuccess: handleGoogleSuccess,
                onError: handleGoogleError,
                className: 'h-[6vw] w-auto min-h-20 max-h-25'
            })
        )
    );
} 