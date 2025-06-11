import { myJSX } from '../util/mini-jsx';
import { SoundButton } from '../global/SoundButton';

interface EntryScreenProps {
    onPlayClick: () => void;
}

export function EntryScreen({ onPlayClick }: EntryScreenProps) {
    return (
        <div id="entry_screen" class="absolute top-[51%] left-[49.9%] transform -translate-x-1/2 -translate-y-1/2">
            <img src="/art/back.svg" alt="Back" class="h-[420px] w-auto" />
            <img src="/art/star.svg" alt="Star" class="absolute top-18 left-10 h-[80px] w-auto animate-pulse-slow" />
            <img src="/art/star.svg" alt="Star" class="absolute top-4 right-4 h-[40px] w-auto animate-pulse-slow" />
            <img src="/art/star2.svg" alt="Star" class="absolute top-18 right-40 h-[55px] w-auto animate-pulse-slow" />
            <img src="/art/star2.svg" alt="Star" class="absolute bottom-4 left-4 h-[40px] w-auto animate-pulse-slow" />
            <img src="/art/star3.svg" alt="Star" class="absolute bottom-15 right-60 h-[40px] w-auto animate-pulse-slow" />
            <SoundButton position={{ bottom: '4', right: '4' }} />
            <div onClick={onPlayClick} class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 hover:opacity-80 cursor-pointer">
                <img src="/art/play.svg" alt="Play" class="h-[120px] w-auto transform scale-[1.5]" />
            </div>
        </div>
    );
}