import { Component } from "@blitz-ts/Component";
import { GameEngine } from "../../game/gameEngine";

export class GamePage extends Component {
    private gameEngine: GameEngine | null = null;

    constructor() {
        super();
    }

    protected onMount(): void {
        console.log("GamePage onMount called");
        this.initializeGame();
    }

    private initializeGame(): void {
        const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
        if (canvas) {
            console.log("Initializing game engine with canvas:", canvas);
            this.gameEngine = new GameEngine('game-canvas');
            this.gameEngine.startGameLoop();
        } else {
            console.error("Canvas element 'game-canvas' not found");
        }
    }

    protected onUnmount(): void {
        console.log("GamePage onUnmount called");
        // Clean up game engine if needed
        this.gameEngine = null;
    }

    render() {
        console.log("GamePage rendered");
    }
}