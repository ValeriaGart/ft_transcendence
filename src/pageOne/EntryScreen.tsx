import { myJSX } from '../util/mini-jsx';
import { SoundButton } from '../global/SoundButton';

interface EntryScreenProps {
    onPlayClick: () => void;
}

export function EntryScreen({ onPlayClick }: EntryScreenProps) {
    return (
        <div id="entry_screen" class="absolute top-[49%] left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[36%]">
            <img src="/art/back.svg" alt="Back" class="h-full w-full object-fill" />
            <img src="/art/star.svg" alt="Star" class="absolute top-[10%] left-[5%] h-[20%] w-auto animate-pulse-slow" />
            <img src="/art/star.svg" alt="Star" class="absolute top-[3%] right-[3%] h-[10%] w-auto animate-pulse-slow" />
            <img src="/art/star2.svg" alt="Star" class="absolute top-[15%] right-[30%] h-[13%] w-auto animate-pulse-slow" />
            <img src="/art/star2.svg" alt="Star" class="absolute bottom-[4%] left-[4%] h-[10%] w-auto animate-pulse-slow" />
            <img src="/art/star3.svg" alt="Star" class="absolute bottom-[13%] right-[40%] h-[8%] w-auto animate-pulse-slow" />
            <SoundButton position={{ bottom: '4', right: '4' }} />
            <div onClick={onPlayClick} class="absolute top-[50%] left-[50%] transform -translate-x-1/2 -translate-y-1/2 hover:opacity-80 cursor-pointer">
                <img src="/art/play.svg" alt="Play" class="h-[120px] w-auto transform scale-[1.5]" />
            </div>
        </div>
    );
}