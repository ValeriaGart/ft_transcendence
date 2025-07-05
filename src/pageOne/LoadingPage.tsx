import { myJSX } from '../util/mini-jsx';
import { getAuthState } from '../util/auth/authState';

export function LoadingPage() {
    const authState = getAuthState();
    
    const handleClick = () => {
        if (authState.isAuthenticated && authState.user) {
            console.log('User is authenticated, proceeding to main interface...');
            // Don't override content here, let App.tsx handle the authenticated view
            // Just trigger the main app update
            window.dispatchEvent(new CustomEvent('auth-success'));
        } else {
            console.log('User not authenticated, reloading...');
            window.location.reload();
        }
    };

    return myJSX('div', { 
        class: 'h-screen bg-[#B784F2] flex items-center justify-center' 
    },
        myJSX('div', { 
            class: 'text-center relative w-full h-full' 
        },
            myJSX('button', {
                onclick: handleClick,
                class: 'absolute top-[45%] left-[45%] transform -translate-x-1/2 -translate-y-1/2 hover:opacity-80 cursor-pointer'
            },
                myJSX('img', { 
                    src: '/art/loading.svg', 
                    alt: 'loading', 
                    class: 'h-[420px] w-auto' 
                })
            ),
            authState.isAuthenticated ? myJSX('div', { 
                class: 'absolute bottom-10 left-1/2 transform -translate-x-1/2 text-white text-xl' 
            }, `Welcome back, ${authState.user?.name || authState.user?.email}!`) : null
        )
    );
} 