import { myJSX } from '../util/mini-jsx';
import { SoundButton } from '../global/SoundButton';

export function SignupPage() {
    return (
        <div id="signup_page" class="absolute top-[51%] left-[49.9%] transform -translate-x-1/2 -translate-y-1/2">
            <img src="/art/back2.svg" alt="Back2" class="h-[420px] w-auto" />
            <SoundButton position={{ bottom: '4', right: '4' }} />
        </div>
    );
} 