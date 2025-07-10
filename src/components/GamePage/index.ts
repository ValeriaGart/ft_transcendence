import { Component } from "@blitz-ts";
import { GameEngine } from "../../game/gameEngine";

export class GamePage extends Component {
    private gameEngine: GameEngine | null = null;

    constructor() {
        super();
    }

    render() {
        const canvas = document.createElement('canvas');
        canvas.id = 'gameCanvas';
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.maxWidth = '1600px';
        canvas.style.maxHeight = '900px';
        
        const element = this.getElement();
        if (element) {
            element.innerHTML = '';
            element.appendChild(canvas);

            setTimeout(() => {
                this.initializeGame();
            }, 0);
        }
    }

    private initializeGame(): void {
        try {
            this.gameEngine = new GameEngine('gameCanvas');
            this.gameEngine.startGameLoop();
            console.log('Game engine initialized successfully');
        } catch (error) {
            console.error('Failed to initialize game engine:', error);
        }
    }

    protected onUnmount(): void {
        super.onUnmount();
    }
}
