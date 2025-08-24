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
        // Show loading state until we get STARTMATCH message
        console.log('GamePage: render called, showing loading state...');
        
        const element = this.getElement();
        if (element) {
            element.innerHTML = `
                <div style="display: flex; justify-content: center; align-items: center; height: 100vh; color: #81C3C3; font-family: 'Irish Grover', cursive; font-size: 24px;">
                    Loading game...
                </div>
            `;
        }
    }

    protected onMount(): void {
        console.log('GamePage: onMount called');
        
        // First, handle local quick-start (no websocket) if flagged
        try {
            const localMode = localStorage.getItem('local_mode');
            const localGameMode = localStorage.getItem('local_gameMode') || 'bestof';
            if (localMode === 'MULTI') {
                const p1 = localStorage.getItem('local_p1_alias') || 'Player 1';
                const p2 = localStorage.getItem('local_p2_alias') || 'Player 2';
                const payload = {
                    type: 'STARTMATCH',
                    roomId: 'local',
                    urp: 1,
                    players: [
                        { nick: p1, ai: false, pnumber: 1 },
                        { nick: p2, ai: false, pnumber: 2 }
                    ],
                    gameMode: localGameMode,
                    oppMode: 'multi'
                };
                try {
                    localStorage.removeItem('local_mode');
                    localStorage.removeItem('local_p1_alias');
                    // keep p2 alias for next defaults
                } catch {}
                this.createCanvas();
                const fakeEvent = { data: JSON.stringify(payload) } as MessageEvent;
                this.gameEngine = new GameEngine('gameCanvas');
                this.gameEngine.startGameLoop(fakeEvent);
                return;
            }
            if (localMode === 'TOURNAMENT') {
                const p1 = localStorage.getItem('local_p1_alias') || 'Player 1';
                const aliasesRaw = localStorage.getItem('local_tournament_aliases');
                let a2 = 'Player 2', a3 = 'Player 3', a4 = 'Player 4';
                try {
                    const arr = JSON.parse(aliasesRaw || '[]');
                    a2 = arr[0] || a2; a3 = arr[1] || a3; a4 = arr[2] || a4;
                } catch {}
                const payload = {
                    type: 'STARTMATCH',
                    roomId: 'local',
                    urp: 1,
                    players: [
                        { nick: p1, ai: false, pnumber: 1 },
                        { nick: a2, ai: false, pnumber: 2 },
                        { nick: a3, ai: false, pnumber: 3 },
                        { nick: a4, ai: false, pnumber: 4 }
                    ],
                    gameMode: 'tournament',
                    oppMode: 'multi'
                };
                try {
                    localStorage.removeItem('local_mode');
                    localStorage.removeItem('local_p1_alias');
                    localStorage.removeItem('local_tournament_aliases');
                } catch {}
                this.createCanvas();
                const fakeEvent = { data: JSON.stringify(payload) } as MessageEvent;
                this.gameEngine = new GameEngine('gameCanvas');
                this.gameEngine.startGameLoop(fakeEvent);
                return;
            }
        } catch {}

        // Check if we have a stored STARTMATCH message from StartGamePopUp
        const ws = WebSocketService.getInstance();
        const storedMessage = ws.getLastStartMatchMessage();
        
        console.log('GamePage: storedMessage =', storedMessage);
        
        if (storedMessage) {
            console.log('Found stored STARTMATCH message, creating canvas and starting game...');
            this.createCanvas();
            this.msg = storedMessage;
            ws.clearLastStartMatchMessage();
            setTimeout(() => {
                this.initializeGame();
            }, 100);
        } else {
            console.log('No stored message found, listening for new STARTMATCH messages...');
            // Use existing WebSocket connection and listen for messages
            if (ws.isConnected()) {
                console.log('Using existing WebSocket connection');
                ws.ws.onmessage = (message) => {
                    console.log("GamePage received message: ", message.data);
                    if (this.parseMessage(message)) {
                        this.createCanvas();
                        this.msg = message;
                        setTimeout(() => {
                            this.initializeGame();
                        }, 0);
                    }
                };
            } else {
                console.log('Connecting to WebSocket...');
                ws.connect(getWebSocketUrl('/hello-ws'));
                ws.ws.onmessage = (message) => {
                    console.log("GamePage received message: ", message.data);
                    if (this.parseMessage(message)) {
                        this.createCanvas();
                        this.msg = message;
                        setTimeout(() => {
                            this.initializeGame();
                        }, 0);
                    }
                };
            }
        }
    }

    private createCanvas(): void {
        console.log('createCanvas() called');
        
        // Check if canvas already exists
        let canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
        console.log('Existing canvas:', canvas);
        
        if (!canvas) {
            console.log('Creating new canvas...');
            canvas = document.createElement('canvas');
            canvas.id = 'gameCanvas';
            canvas.style.width = '100%';
            canvas.style.height = '100%';
            canvas.style.maxWidth = '1600px';
            canvas.style.maxHeight = '900px';

            const element = this.getElement();
            console.log('GamePage element:', element);
            
            if (element) {
                console.log('Setting innerHTML and appending canvas...');
                element.innerHTML = '';
                element.appendChild(canvas);
                console.log('Canvas appended to element');
            } else {
                console.error('GamePage element not found!');
            }
        }
        
        console.log('Canvas created/found successfully:', canvas);
    }

    private parseMessage(message: MessageEvent): boolean {
        var msg
        msg = JSON.parse(message.data);

        if (msg.type == "ERROR") {
            window.location.assign('/user');
        }
        if (msg.type !== "STARTMATCH") {
            // console.error("Unexpected message type:", msg.type);
            return false;
        }
        return true;
    }

    private initializeGame(): void {
        try {
            console.log('GamePage: initializeGame called');
            console.log('GamePage: this.msg =', this.msg);
            console.log('GamePage: this.msg.data =', this.msg?.data);
            
            // Double-check that canvas exists before creating GameEngine
            const canvas = document.getElementById('gameCanvas');
            console.log('Looking for canvas with ID gameCanvas...');
            console.log('All canvas elements:', document.querySelectorAll('canvas'));
            console.log('Canvas found:', canvas);
            
            if (!canvas) {
                console.error('Canvas not found. Cannot start game.');
                return;
            }
            
            this.gameEngine = new GameEngine('gameCanvas');
            console.log('GamePage: GameEngine created');
            
            if (this.msg) {
                console.log('GamePage: Starting game loop with message');
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
