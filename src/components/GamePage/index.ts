import { Component } from "@blitz-ts";
import { GameEngine } from "../../game/gameEngine";
import { WebSocketService } from "./../../lib/webSocket";

export class GamePage extends Component {
    private gameEngine: GameEngine | null = null;

    private msg: MessageEvent | null = null;
    private pmsg: object | null = null;

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

        // this.waitForMessage(ws.ws)
        //     .then((message) => {
        //         console.log("message: ", message.data);
        //         if (!this.parseMessage(message)) {
        //             return;
        //         }
        //         console.log('Parsed message successfully');
        //         this.msg = message;
        //         this.pmsg = JSON.parse(message.data);
        //         if (!this.pmsg) {
        //            console.error('parsing (and saving) message failed.');
        //         }
        //         else {
        //             console.log('Parsed message:', this.pmsg);
        //         }
        //     });

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

    // private async waitForMessage(ws: WebSocket): Promise<MessageEvent> {
    //     return new Promise((resolve) => {
    //         ws.onmessage = (event) => {
    //             resolve(event);
    //         }
    //     });
    // }

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
            if (!this.pmsg) {
                console.error('No parsed message available to start the game engine.');
            }
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
