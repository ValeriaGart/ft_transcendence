import { Component } from "@blitz-ts";
import { GameEngine } from "../../game/gameEngine";
import { WebSocketService } from "./../../lib/webSocket";

export class GamePage extends Component {
    private gameEngine: GameEngine | null = null;

    private roomID: string | null = null;
    private p1Nick: string | null = null;
    private p2Nick: string | null = null;
    private p1AI: boolean = false;
    private p2AI: boolean = false;
    private gameMode: string | null = null;
    private oppMode: string | null = null;
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
        ws.connect('ws://localhost:3000/hello-ws')

        // ws.onmessage = (event) => {
        //     console.log('reply', event.data);
        // }
        this.waitForMessage(ws.ws)
            .then((message) => {
                console.log("message: ", message.data);
                if (!this.parseMessage(message)) {
                    return;
                }
                this.msg = message;
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

    private parseMessage(message: MessageEvent): boolean {
        var msg
        msg = JSON.parse(message.data);

        if (msg.type !== "STARTMATCH") {
            console.error("Unexpected message type:", msg.type);
            return false;
        }

        this.roomID = msg.roomId;
        this.p1Nick = msg.players[0].nick;
        this.p2Nick = msg.players[1].nick;
        this.p1AI = msg.players[0].ai;
        this.p2AI = msg.players[1].ai;
        this.gameMode = msg.gameMode;
        this.oppMode = msg.oppMode;
        console.log('id: ', this.roomID);
        console.log('p1: ', this.p1Nick, ' AI: ', this.p1AI);
        console.log('p2: ', this.p2Nick, ' AI: ', this.p2AI);
        console.log('game mode: ', this.gameMode);
        console.log('opponent mode: ', this.oppMode);
        return true;
    }

    private initializeGame(): void {
        try {
            this.gameEngine = new GameEngine('gameCanvas');
            this.gameEngine.startGameLoop(this.msg);
            console.log('Game engine initialized successfully');
        } catch (error) {
            console.error('Failed to initialize game engine:', error);
        }
    }

    protected onUnmount(): void {
        super.onUnmount();
    }
}
