import { Component } from "@blitz-ts";
import { GameEngine } from "../../game/gameEngine";
import { WebSocketService } from "./../../lib/webSocket";

export class GamePage extends Component {
    private gameEngine: GameEngine | null = null;

    private roomID;
    private p1Nick;
    private p2Nick;
    private p1AI;
    private p2AI;
    private gameMode;
    private oppMode;

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
        ws.connect('ws://localhost:3000/hello-ws')

        // ws.onmessage = (event) => {
        //     console.log('reply', event.data);
        // }
        this.waitForMessage(ws.ws)
            .then((message) => {
                console.log("message: ", message.data);
                this.parseMessage(message);
            });

        const element = this.getElement();
        if (element) {
            element.innerHTML = '';
            element.appendChild(canvas);

            setTimeout(() => {
                this.initializeGame();
            }, 0);
        }
    }

    private waitForMessage(ws: WebSocket): Promise<MessageEvent> {
        return new Promise((resolve) => {
            ws.onmessage = (event) => {
                resolve(event);
            }
        });
    }

    private parseMessage(message: MessageEvent) {
        var msg
        msg = JSON.parse(message.data);

        this.roomID = msg.roomId;
        console.log('id: ', this.roomID);

    }

    private initializeGame(): void {
        try {
            this.gameEngine = new GameEngine('gameCanvas');
            this.gameEngine.startGameLoop('single', 'infinite');
            console.log('Game engine initialized successfully');
        } catch (error) {
            console.error('Failed to initialize game engine:', error);
        }
    }

    protected onUnmount(): void {
        super.onUnmount();
    }
}
