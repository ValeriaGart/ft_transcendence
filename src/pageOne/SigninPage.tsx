import { myJSX } from '../util/mini-jsx';
import { GoogleSignInButton } from '../global/GoogleSignInButton';
import { SoundButton } from '../global/SoundButton';
import { loginWithEmailPassword, subscribeToAuth } from '../util/auth/authState';

interface SigninPageProps {
    onEnterClick: () => void;
    onSignupClick?: () => void;
}

export function SigninPage({ onEnterClick, onSignupClick }: SigninPageProps) {
    let email = '';
    let password = '';
    let error = '';

    // Subscribe to auth state changes
    subscribeToAuth((newState) => {
        error = newState.error || '';
        
        // Redirect if successfully authenticated
        if (newState.isAuthenticated && newState.user) {
            console.log('User authenticated, redirecting...');
            onEnterClick();
        }
    });

    const handleEmailPassword = async () => {
        if (!email || !password) {
            error = 'Please enter both email and password';
            return;
        }

        try {
            await loginWithEmailPassword(email, password);
        } catch (err) {
            console.error('Login failed:', err);
        }
    };

    const handleGoogleSuccess = (user: any) => {
        console.log('Google sign-in successful:', user);
        onEnterClick();
    };

    const handleGoogleError = (errorMessage: string) => {
        error = errorMessage;
        console.error('Google sign-in failed:', errorMessage);
    };

    return myJSX('div', {
        id: 'signin_page',
        class: 'fixed inset-0 flex items-center justify-center bg-black/50'
    }, 
        myJSX(SoundButton, { position: { bottom: '4', right: '4' } }),
        myJSX('div', {
            class: 'bg-white rounded-lg shadow-xl p-8 w-96 max-w-md mx-4'
        }, 
            myJSX('div', {}, 
                myJSX('h2', {
                    class: 'text-2xl font-bold text-center mb-6 text-gray-800'
                }, 'Welcome Back'),
                
                // Google Sign-in
                myJSX('div', {
                    class: 'mb-4 flex justify-center'
                }, 
                    GoogleSignInButton({
                        onSuccess: handleGoogleSuccess,
                        onError: handleGoogleError,
                        className: 'w-full'
                    })
                ),
                
                // Divider
                myJSX('div', {
                    class: 'text-center text-gray-500 my-4'
                }, 'or'),
                
                // Email
                myJSX('div', {
                    class: 'mb-4'
                }, 
                    myJSX('input', {
                        type: 'email',
                        placeholder: 'Email',
                        class: 'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500',
                        oninput: (e: any) => { email = e.target.value; }
                    })
                ),
                
                // Password
                myJSX('div', {
                    class: 'mb-4'
                }, 
                    myJSX('input', {
                        type: 'password',
                        placeholder: 'Password',
                        class: 'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500',
                        oninput: (e: any) => { password = e.target.value; },
                        onkeypress: (e: any) => {
                            if (e.key === 'Enter') {
                                handleEmailPassword();
                            }
                        }
                    })
                ),
                
                // Error
                error ? myJSX('div', {
                    class: 'mb-4 text-red-600 text-sm text-center'
                }, error) : myJSX('div', {}),
                
                // Sign In Button
                myJSX('button', {
                    onclick: handleEmailPassword,
                    class: 'w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors mb-4'
                }, 'Sign In'),
                
                // Sign Up Link
                myJSX('div', {
                    class: 'text-center text-sm'
                }, 
                    myJSX('span', {
                        class: 'text-gray-600'
                    }, "Don't have an account? "),
                    myJSX('button', {
                        onclick: onSignupClick,
                        class: 'text-blue-600 hover:text-blue-800 font-medium'
                    }, 'Sign Up')
                )
            )
        )
    );
} 