import { Component } from "@blitz-ts";
import { GameEngine } from "../../game/gameEngine";
import { WebSocketService } from "./../../lib/webSocket";
import { getWebSocketUrl } from "../../config/api";

export class GamePage extends Component {
    private gameEngine: GameEngine | null = null;

    private msg: MessageEvent | null = null;

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

        // const ws = new WebSocket('ws://localhost:3000/hello-ws');
        const ws = WebSocketService.getInstance();
        ws.connect(getWebSocketUrl('/hello-ws'))

        ws.ws.onmessage = (message) => {
            console.log("message: ", message.data);
            if (!this.parseMessage(message)) {
                return;
            }
            this.msg = message;

            const element = this.getElement();
            if (element) {
                element.innerHTML = '';
                element.appendChild(canvas);
    
                setTimeout(() => {
                    this.initializeGame();
                }, 0);
            }
        }
    }

    private parseMessage(message: MessageEvent): boolean {
        var msg
        msg = JSON.parse(message.data);

        if (msg.type !== "STARTMATCH") {
            console.error("Unexpected message type:", msg.type);
            return false;
        }
        return true;
    }

    private initializeGame(): void {
        try {
            this.gameEngine = new GameEngine('gameCanvas');
            if (this.msg) {
                this.gameEngine.startGameLoop(this.msg);
                console.log('Game engine initialized successfully');
            } else {
                console.error('No message available to start the game loop.');
            }
        } catch (error) {
            console.error('Failed to initialize game engine:', error);
        }
    }

    protected onUnmount(): void {
        super.onUnmount();
    }
}
