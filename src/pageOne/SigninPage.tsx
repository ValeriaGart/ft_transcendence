import { myJSX } from '../util/mini-jsx';
import { SoundButton } from '../global/SoundButton';

interface SigninPageProps {
    onEnterClick: () => void;
}

export function SigninPage({ onEnterClick }: SigninPageProps) {
    const handleClick = () => {
        console.log('SigninPage: Enter button clicked');
        onEnterClick();
    };

    return (
        <div id="signin_page" class="absolute top-[51%] left-[49.9%] transform -translate-x-1/2 -translate-y-1/2">
            <img src="/art/signin_up/back3.svg" alt="Back3" class="h-[420px] w-auto" />
            <SoundButton position={{ bottom: '4', right: '4' }} />
            <div onClick={handleClick} class="absolute top-[40%] right-[0.3%] cursor-pointer hover:opacity-80">
                <img src="/art/signin_up/enter_button.svg" alt="Enter" class="h-[125px] w-auto" />
            </div>
        </div>
    );
} 