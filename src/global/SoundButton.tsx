import { myJSX, Fragment } from '../util/mini-jsx';
import { useState } from '../util/state/state';

interface SoundButtonProps {
    position?: {
        top?: string;
        bottom?: string;
        left?: string;
        right?: string;
    };
}

// SoundButton component that handles background music playback
export function SoundButton({ position = { bottom: '6', right: '6' } }: SoundButtonProps) {
    // Get initial state from localStorage, default to false if not set
    const savedState = localStorage.getItem('soundEnabled') === 'true';
    const [isSoundEnabled, setIsSoundEnabled] = useState(savedState);

    // Function to toggle sound on/off when button is clicked
    const toggleSound = () => {
        if (isSoundEnabled) {
            // If sound is on, remove the audio element
            const oldAudio = document.getElementById('bgMusic');
            if (oldAudio) {
                oldAudio.remove();
            }
            setIsSoundEnabled(false);
            localStorage.setItem('soundEnabled', 'false');
        } else {
            // If sound is off, create and play a new audio element
            const audio = document.createElement('audio');
            audio.id = 'bgMusic';
            audio.loop = true;
            const source = document.createElement('source');
            source.src = '/music/game_music.mp3';
            source.type = 'audio/mpeg';
            audio.appendChild(source);
            document.body.appendChild(audio);
            audio.play();
            setIsSoundEnabled(true);
            localStorage.setItem('soundEnabled', 'true');
        }
    };

    // Initialize audio if sound was enabled in previous session


    // Build position classes based on props
    const positionClasses = Object.entries(position)
        .map(([key, value]) => `${key}-${value}`)
        .join(' ');

    return (
        <div>
            {/* Button that toggles sound on/off */}
            <button onClick={toggleSound} class={`absolute ${positionClasses} hover:opacity-80`}>
                <img
                    src={isSoundEnabled ? "/art/sound-button.svg" : "/art/sound_button_off.svg"}
                    alt="Sound"
                    class="h-[40px] w-[40px]"
                />
            </button>
        </div>
    );
} 