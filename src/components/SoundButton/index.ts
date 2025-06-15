import { Component } from "@blitz-ts/Component";

interface SoundButtonState {
    isSoundEnabled: boolean;
}



export class SoundButton extends Component<{}, SoundButtonState> {
    protected static state: SoundButtonState = {
        isSoundEnabled: false,
    }

    constructor() {
        super();
        this.toggleSound = this.toggleSound.bind(this);
        this.markStructural('isSoundEnabled');
    }

    protected onMount(): void {
        console.log('SoundButton mounted, current state:', this.state);
        this.setState({ isSoundEnabled: localStorage.getItem('soundEnabled') === 'true' });
        console.log('SoundButton state after setState:', this.state);
        this.addEventListener("button", "click", this.toggleSound);
    }

    protected onUnmount(): void {
        this.removeEventListener("button", "click", this.toggleSound);
    }

    toggleSound() {
        console.log('toggleSound called, current state:', this.state);
        if (this.state.isSoundEnabled) {
            // If sound is on, remove the audio element
            const oldAudio = document.getElementById('bgMusic');
            if (oldAudio) {
                oldAudio.remove();
            }
            this.setState({ isSoundEnabled: false });
            console.log('SoundButton state after toggle off:', this.state);
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
            this.setState({ isSoundEnabled: true });
            console.log('SoundButton state after toggle on:', this.state);
            localStorage.setItem('soundEnabled', 'true');
        }
    }

    render() {}
}