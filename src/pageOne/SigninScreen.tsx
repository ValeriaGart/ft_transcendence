import { myJSX } from '../util/mini-jsx';
import { SoundButton } from '../global/SoundButton';

interface SigninScreenProps {
    onSignInClick: () => void;
    onSignUpClick: () => void;
}

export function SigninScreen({ onSignInClick, onSignUpClick }: SigninScreenProps) {
    return (
        <div id="signin_screen" class="absolute top-[49%] left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[36%]">
            <img src="/art/back2.svg" alt="Back2" class="h-full w-full object-fill" />
            <SoundButton position={{ bottom: '4', right: '4' }} />
            <div class="absolute top-[40%] left-[5%] h-[20%] w-auto flex gap-8">
                <div onClick={onSignUpClick} class="cursor-pointer hover:opacity-80">
                    <span class="text-[#FFF7AC] font-['Irish_Grover'] text-[38px] lg:text-[42px] xl:text-[50px] 2xl:text-[55px]">Sign up</span>
                </div>
            </div>
            <div class="absolute top-[40%] left-[60%] h-[20%] w-auto flex gap-8">
                <div onClick={onSignInClick} class="cursor-pointer hover:opacity-80">
                    <span class="text-[#FFF7AC] font-['Irish_Grover'] text-[38px] lg:text-[42px] xl:text-[50px] 2xl:text-[55px]">Sign in</span>
                </div>
            </div>
        </div>
    );
} 