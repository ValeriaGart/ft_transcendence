import { myJSX } from '../util/mini-jsx';
import { SoundButton } from '../global/SoundButton';

interface SigninScreenProps {
    onSignInClick: () => void;
    onSignUpClick: () => void;
}

export function SigninScreen({ onSignInClick, onSignUpClick }: SigninScreenProps) {
    return (
        <div id="signin_screen" class="absolute top-[51%] left-[49.9%] transform -translate-x-1/2 -translate-y-1/2">
            <img src="/art/back2.svg" alt="Back2" class="h-[420px] w-auto" />
            <SoundButton position={{ bottom: '4', right: '4' }} />
            <div class="absolute top-[40%] left-[5%] flex gap-8">
                <div onClick={onSignUpClick} class="cursor-pointer hover:opacity-80">
                    <span class="text-[#FFF7AC] font-['Irish_Grover'] text-[52px]">Sign up</span>
                </div>
            </div>
            <div class="absolute top-[40%] left-[60%] flex gap-8">
                <div onClick={onSignInClick} class="cursor-pointer hover:opacity-80">
                    <span class="text-[#FFF7AC] font-['Irish_Grover'] text-[52px]">Sign in</span>
                </div>
            </div>
        </div>
    );
} 