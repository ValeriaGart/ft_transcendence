import { Component } from "@blitz-ts/Component";

interface SoundButtonProps {
    bottom?: string;
    right?: string;
}

interface SoundButtonState {
    isSoundEnabled: boolean;
    positionClasses: string;
}

export class SoundButton extends Component<SoundButtonProps, SoundButtonState> {
    protected static state: SoundButtonState = {
        isSoundEnabled: false,
        positionClasses: "bottom-4 right-4", // Default position
    }

    constructor(props: SoundButtonProps = {}) {
        super(props);
        this.toggleSound = this.toggleSound.bind(this);
        this.markStructural('isSoundEnabled');
        
        // Set position classes based on props
        const bottom = props.bottom || "bottom-4";
        const right = props.right || "right-4";
        this.setState({ positionClasses: `${bottom} ${right}` });
    }

    protected onMount(): void {
        this.setState({ isSoundEnabled: localStorage.getItem('soundEnabled') === 'true' });
        this.addEventListener("button", "click", this.toggleSound);
        
        // Apply position classes after mount
        this.applyPositionClasses();
    }

    private applyPositionClasses(): void {
        setTimeout(() => {
            const button = this.element.querySelector('button');
            if (button) {
                button.className = `absolute ${this.state.positionClasses} hover:opacity-80 cursor-pointer`;
            }
        }, 0);
    }

    protected onUnmount(): void {
        this.removeEventListener("button", "click", this.toggleSound);
    }

    toggleSound() {
        if (this.state.isSoundEnabled) {
            // If sound is on, remove the audio element
            const oldAudio = document.getElementById('bgMusic');
            if (oldAudio) {
                oldAudio.remove();
            }
            this.setState({ isSoundEnabled: false });
            localStorage.setItem('soundEnabled', 'false');
        } else {
            const audio = document.createElement('audio');
            audio.id = 'bgMusic';
            audio.loop = true;
            const source = document.createElement('source');
            source.src = '/music/game_music.mp3';
            source.type = 'audio/mpeg';
            audio.appendChild(source);
            document.body.appendChild(audio);
            audio.play();
            this.setState({ isSoundEnabled: true });
            localStorage.setItem('soundEnabled', 'true');
        }
        
        this.applyPositionClasses();
    }

    render() {
        this.applyPositionClasses();
    }
}