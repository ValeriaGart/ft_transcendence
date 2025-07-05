import { myJSX } from '../util/mini-jsx';
import { SoundButton } from '../global/SoundButton';
import { GoogleSignInButton } from '../global/GoogleSignInButton';
import { useState } from '../util/state/state';
import { EmailInput } from '../global/EmailInput';
import { PasswordInput } from '../global/PasswordInput';
import { Error } from '../global/Error';
import { subscribeToAuth } from '../util/auth/authState';

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

    useEffect(() => {
        const unsubscribe = subscribeToAuth((newState) => {
            if (newState.isAuthenticated && newState.user) {
                console.log('User registered via Google OAuth, navigating...');
                onEnterClick();
            }
            if (newState.error) {
                setApiError(newState.error);
            }
        });
        return () => {
            unsubscribe();
        };
    }, []);

    const handleEmailChange = (newEmail: string, isValid: boolean) => {
        setEmail(newEmail);
        setIsEmailValid(isValid);
        setApiError('');
    };

    const handlePasswordChange = (newPassword: string, isValid: boolean) => {
        setPassword(newPassword);
        setIsPasswordValid(isValid);
        setIsConfirmPasswordValid(newPassword === confirmPassword);
        setApiError('');
    };

    const handleConfirmPasswordChange = (e: Event) => {
        const newConfirmPassword = (e.target as HTMLInputElement).value;
        setConfirmPassword(newConfirmPassword);
        setIsConfirmPasswordValid(newConfirmPassword === password);
        setApiError('');
    };

    const handleClick = async () => {
        if (!isEmailValid || !isPasswordValid || !isConfirmPasswordValid) {
            return;
        }

        try {
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

            const responseText = await response.text();

            if (!response.ok) {
                let errorMessage = 'Registration failed';
                try {
                    const errorData = JSON.parse(responseText);
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

            onEnterClick();
        } catch (error) {
            console.error('Registration error:', error);
            setApiError('Failed to connect to the server. Please try again.');
        }
    };

    const handleGoogleSuccess = () => {
        onEnterClick();
    };

    const handleGoogleError = (errorMessage: string) => {
        setApiError(errorMessage);
    };

    return (
        myJSX('div', {
            id: 'signup_page',
            class: 'absolute top-[49%] left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[37%]'
        },
            myJSX('img', {
                src: '/art/signin_up/Backsignup.svg',
                alt: 'Back4',
                class: 'h-full w-full object-fill'
            }),
            myJSX(SoundButton, { position: { bottom: '4', right: '4' } }),
            
            // Google Sign-up button (positioned at top-left area)
            myJSX('div', {
                class: 'absolute top-[15%] left-[5%] w-[40%]'
            },
                GoogleSignInButton({
                    onSuccess: handleGoogleSuccess,
                    onError: handleGoogleError,
                    className: 'transform scale-75'
                })
            ),

            myJSX('div', {
                class: 'absolute flex flex-col top-[39%] left-[30%] text-[90%] xl:text-[110%] 2xl:text-[120%] gap-y-3 xl:gap-y-[1.1vw] 2xl:gap-y-[1.4vw]'
            },
                myJSX(EmailInput, {
                    value: email,
                    onChange: handleEmailChange,
                    textColor: '#B784F2',
                    placeholderColor: 'purple-400',
                    className: 'w-full'
                }),
                myJSX(PasswordInput, {
                    value: password,
                    onChange: handlePasswordChange,
                    textColor: '#B784F2',
                    placeholderColor: 'purple-400',
                    className: 'w-full'
                }),
                myJSX('div', {
                    class: 'flex flex-col w-full'
                },
                    myJSX('input', {
                        type: 'password',
                        placeholder: 'Confirm Password',
                        value: confirmPassword,
                        onChange: handleConfirmPasswordChange,
                        class: 'p-1 pl-2 focus:outline-0 text-[#B784F2] placeholder-purple-400'
                    }),
                    !isConfirmPasswordValid && confirmPassword ? myJSX(Error, { message: 'Passwords do not match' }) : myJSX('div', {})
                ),
                apiError ? myJSX('div', {},
                    myJSX(Error, { message: apiError })
                ) : myJSX('div', {})
            ),

            myJSX('div', {
                onclick: handleClick,
                class: `absolute top-[40%] left-[0.3%] w-auto cursor-pointer ${isEmailValid && isPasswordValid && isConfirmPasswordValid ? 'hover:opacity-80' : 'opacity-50'}`
            },
                myJSX('img', {
                    src: '/art/signin_up/enter_button2.svg',
                    alt: 'Enter',
                    class: 'h-[9vw] w-auto min-h-25 max-h-35'
                })
            )
        )
    );
}