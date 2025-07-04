import { myJSX } from '../util/mini-jsx';
import { EntryScreen } from './EntryScreen';
import { SigninScreen } from './SigninScreen';
import { SigninPage } from './SigninPage';
import { SignupPage } from './SignupPage';
import { useState } from '../util/state/state';
import { SoundButton } from '../global/SoundButton';

interface AppOneProps {
    onEnterClick: () => void;
}

export function AppOne({ onEnterClick }: AppOneProps) {
    const [currentScreen, setCurrentScreen] = useState<'entry' | 'signin' | 'signinPage' | 'signupPage'>('entry');

    const handleSignInClick = () => {
        console.log('AppOne: Sign in clicked');
        setCurrentScreen('signinPage');
    };

    const handleSignUpClick = () => {
        console.log('AppOne: Sign up clicked');
        setCurrentScreen('signupPage');
    };

    console.log('AppOne: Rendering screen:', currentScreen);

    return (
        <div id="app1" class="flex flex-col h-screen">
            <div id="mainpart" class="relative flex items-center flex-1 justify-center bg-[#C4DADA] px-7 py-1">
                <div class="absolute bottom-4 right-4">
                    <SoundButton />
                </div>
                <div class="relative">
                    <img
                        src="/art/controller.svg"
                        alt="Controller"
                        class="min-w-6xl"
                    />
                    {currentScreen === 'entry' ? (
                        <EntryScreen onPlayClick={() => setCurrentScreen('signin')} />
                    ) : currentScreen === 'signin' ? (
                        <SigninScreen onSignInClick={handleSignInClick} onSignUpClick={handleSignUpClick} />
                    ) : currentScreen === 'signinPage' ? (
                        <SigninPage onEnterClick={() => {
                            console.log('AppOne: Enter clicked, calling parent handler');
                            onEnterClick();
                        }} />
                    ) : (
                        <SignupPage onEnterClick={() => {
                            console.log('AppOne: Enter clicked from signup, calling parent handler');
                            onEnterClick();
                        }} />
                    )}
                </div>
            </div>
            <div class="w-screen h-[10%] bg-[#B0D5D5] flex items-center justify-center">
                <a href="https://github.com/ValeriaGart/ft_transcendence" target="_blank" rel="noopener noreferrer" class="flex items-center gap-4 hover:opacity-80">
                    <img src="/art/githubicon.svg" alt="githubicon" class="h-[40px] w-auto" />
                    <span class="text-[#81C3C3] font-['Irish_Grover'] text-[200%] md:text-[300%]">Our project on github</span>
                </a>
            </div>
        </div>
    );
} 