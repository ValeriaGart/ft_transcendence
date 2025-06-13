import { myJSX } from '../util/mini-jsx';
import { SoundButton } from '../global/SoundButton';

interface SignupPageProps {
    onEnterClick: () => void;
}

export function SignupPage({ onEnterClick }: SignupPageProps) {
    const handleClick = () => {
        console.log('SignupPage: Enter button clicked');
        onEnterClick();
    };
    return (
        <div id="signup_page" class="absolute top-[49%] left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[37%]">
            <img src="/art/signin_up/back4.svg" alt="Back4" class="h-full w-full object-fill" />
            <SoundButton position={{ bottom: '4', right: '4' }} />
            <div onClick={handleClick} class="absolute top-[40%] left-[0.3%] w-auto cursor-pointer hover:opacity-80">
                <img src="/art/signin_up/enter_button2.svg" alt="Enter" class="h-[9vw] w-auto min-h-25 max-h-35" />
            </div>
        </div>
    );
} 