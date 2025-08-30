import { GameMode, GameState, OpponentMode } from './types.ts';
import { GameStateMachine } from './gameStateMachine.ts';
import { SelectScreen } from './selectScreen.ts';
import { StartScreen } from './startScreen.ts';
import { InputHandler } from './inputHandler.ts';
import { PongGame } from './pongGame.ts';
import { Player } from './player.ts';
import { Tournament } from './tournament.ts';
import { OpponentScreen } from './opponentSelectScreen.ts';
import { WebSocketService } from "../lib/webSocket";
import { BreakoutGame } from './breakoutGame.ts';

export class GameEngine {
	//standard classes
	public readonly _canvas: HTMLCanvasElement;
	public readonly _ctx: CanvasRenderingContext2D;

	//custom classes
	public _startScreen: StartScreen;
	public _opponentScreen: OpponentScreen
	public _selectScreen: SelectScreen;
	public _gameStateMachine: GameStateMachine;
	public _pongGame: PongGame | BreakoutGame | null = null;
	private _inputHandler: InputHandler;
	private _tournament: Tournament | undefined = undefined;

	//game variables
	public _roomID: string | null = null;
	public _urp: number = 0;
	private _p1Nick: string | null = null;
	private _p2Nick: string | null = null;
	private _p3Nick: string | null = null;
	private _p4Nick: string | null = null;
	private _p1AI: boolean = true;
	private _p2AI: boolean = true;
	private _p3AI: boolean = true;
	private _p4AI: boolean = true;
	private _p1ID: number | null = null;
	private _p2ID: number | null = null;
	private _p4ID: number | null = null;
	private _p3ID: number | null = null;
	private _gameModeStr: string | null = null;
	private _oppModeStr: string | null = null;
	private _gameMode: GameMode = GameMode.INFINITE;
	private _oppMode: OpponentMode = OpponentMode.SINGLE;

	public _ws = WebSocketService.getInstance();
	private _intervalId?: NodeJS.Timeout;
	private _beforeUnloadHandler?: (e: BeforeUnloadEvent) => void;
	private _pageHideHandler?: (e: Event) => void;

	constructor(canvasID: string) {
		this._canvas = document.getElementById(canvasID) as HTMLCanvasElement;
		this._ctx = this._canvas.getContext('2d')!;

		this._canvas.height = 900;
		this._canvas.width = 1600;

		console.log('Canvas width: ', this._canvas.width);
		console.log('Canvas height: ', this._canvas.height);
		console.log('Context: ', this._ctx);


		this._startScreen = new StartScreen(this);
		this._opponentScreen = new OpponentScreen(this);
		this._selectScreen = new SelectScreen(this);
		this._gameStateMachine = new GameStateMachine(this);
		// this._pongGame = new PongGame;
		this._inputHandler = new InputHandler(this);
	}
	
	public startGame(mode: GameMode, oppMode: OpponentMode): void {
		if (mode == GameMode.TOURNAMENT) {
			this.tournamentHandler(mode, oppMode);
		}
		else if (mode == GameMode.BREAKOUT) {
			this.breakoutHandler(mode, oppMode);
		}
		else {
			this.singleGameHandler(mode, oppMode);
		}
	}
	
	private tournamentHandler(mode: GameMode, oppMode: OpponentMode): void {
		if (oppMode == OpponentMode.SINGLE && this._p1ID && this._p2ID && this._p3ID && this._p4ID) {
			var p1: Player = new Player(this._p1Nick ?? 'player', 4, false, this._p1ID);
			var p2: Player = new Player('bot1', 4, true, this._p2ID);
			var p3: Player = new Player('bot2', 4, true, this._p3ID);
			var p4: Player = new Player('bot3', 4, true, this._p4ID);

			this._tournament = new Tournament(this, p1, p2, p3, p4, mode, oppMode);
			this._tournament.battleOne();
		}
		if (this._p1ID && this._p2ID && this._p3ID && this._p4ID) {
			var p1: Player = new Player(this._p1Nick ?? 'player', 4, this._p1AI, this._p1ID);
			var p2: Player = new Player(this._p2Nick ?? 'bot3', 4, this._p2AI, this._p2ID);
			var p3: Player = new Player(this._p3Nick ?? 'bot2', 4, this._p3AI, this._p3ID);
			var p4: Player = new Player(this._p4Nick ?? 'bot1', 4, this._p4AI, this._p4ID);

			this._tournament = new Tournament(this, p1, p2, p3, p4, mode, oppMode);
			this._tournament.preBattle(1);
		}
	}

	public startRoundTwo(): void {
		this._pongGame = null;
		this._tournament?.preBattle(2);
	}
	
	public startTournamentMiddle(): void {
		this._pongGame = null;
		this._tournament?.tournamentMiddle();
	}
	
	public startRoundThree(): void {
		this._pongGame = null;
		this._tournament?.preBattle(3);
	}
	
	public startRoundFour(): void {
		this._pongGame = null;
		this._tournament?.preBattle(4);
	}
	
	public endTournament(): void {
		this._pongGame = null;
		this._tournament?.winScreen();
	}
	
	private singleGameHandler(mode: GameMode, oppMode: OpponentMode): void {
		if (mode == GameMode.TEAMS && this._p1ID && this._p2ID && this._p3ID && this._p4ID) {
			var playerOne: Player = new Player(this._p1Nick ?? 'player1', 0, false, this._p1ID);
			var playerTwo: Player = new Player(this._p2Nick ?? 'player2', 0, false, this._p2ID);
			var playerThree: Player = new Player(this._p3Nick ?? 'player3', 0, false, this._p3ID);
			var playerFour: Player = new Player(this._p4Nick ?? 'player4', 0, false, this._p4ID);
			this._pongGame = new PongGame(this, mode, oppMode, playerOne, playerTwo, playerThree, playerFour);
		}
		else if (oppMode == OpponentMode.SINGLE && this._p1ID && this._p2ID) {
			var playerOne: Player = new Player(this._p1Nick ?? 'player', 0, false, this._p1ID);
			var playerTwo: Player = new Player(this._p2Nick ?? 'bot', 0, true, this._p2ID);
			this._pongGame = new PongGame(this, mode, oppMode, playerOne, playerTwo);
		}
		else if (this._p1ID && this._p2ID) {
			var playerOne: Player = new Player(this._p1Nick ?? 'player1', 0, false, this._p1ID);
			var playerTwo: Player = new Player(this._p2Nick ?? 'player2', 0, false, this._p2ID);
			this._pongGame = new PongGame(this, mode, oppMode, playerOne, playerTwo);
		}
	}

	private breakoutHandler(mode: GameMode, oppMode: OpponentMode) {
		if (mode == GameMode.BREAKOUT && this._p1ID && this._p2ID) {
			var p1: Player = new Player(this._p1Nick ?? 'player1', 0, false, this._p1ID);
			var p2: Player = new Player(this._p2Nick ?? 'player2', 0, false, this._p2ID);
			this._pongGame = new BreakoutGame(this, mode, oppMode, p1, p2);
		}
	}

	private parseMessage(message: MessageEvent){
		var msg
		msg = JSON.parse(message.data);
		console.log("full message: ", msg);

		this._roomID = msg.roomId;
		this._urp = msg.urp;
		this._p1Nick = msg.players[0].nick;
		this._p2Nick = msg.players[1].nick;
		this._p3Nick = msg.players[2]?.nick || null;
		this._p4Nick = msg.players[3]?.nick || null;
		this._p1AI = msg.players[0].ai;
		this._p2AI = msg.players[1].ai;
		this._p3AI = msg.players[2]?.ai;
		this._p4AI = msg.players[3]?.ai;
		this._p1ID = msg.players[0].pnumber;
		this._p2ID = msg.players[1].pnumber;
		this._p3ID = msg.players[2]?.pnumber || 0;
		this._p4ID = msg.players[3]?.pnumber || 0;
		this._gameModeStr = msg.gameMode;
		this._oppModeStr = msg.oppMode;
		console.log('id: ', this._roomID);
		console.log('p1: ', this._p1Nick, ' AI: ', this._p1AI);
		console.log('p2: ', this._p2Nick, ' AI: ', this._p2AI);
		console.log('game mode: ', this._gameModeStr);
		console.log('opponent mode: ', this._oppModeStr);
	}

	private removeAllEventListeners(): void {
		const canvas = document.getElementById(this._canvas.id);
		if (canvas) {
			canvas.replaceWith(canvas.cloneNode(true));
		}
	}

	private cleanup(): void {
		this.removeAllEventListeners();
		// Detach page lifecycle handlers
		try {
			if (this._beforeUnloadHandler) {
				window.removeEventListener('beforeunload', this._beforeUnloadHandler as any, { capture: true } as any);
				(this as any)._beforeUnloadHandler = undefined;
			}
			if (this._pageHideHandler) {
				window.removeEventListener('pagehide', this._pageHideHandler as any, { capture: true } as any);
				(this as any)._pageHideHandler = undefined;
			}
		} catch {}
		if (this._canvas) {
			if (this._ctx) {
				this._ctx.clearRect(0,0, this._canvas.width, this._canvas.height);
			}
			this._canvas.remove();
		}
	}

	public endGameLoop(): void {
		if (this._intervalId) {
			clearInterval(this._intervalId);
			this.cleanup();
			// Force full reload to reset UserPage state consistently (AI and 1v1)
			window.location.assign('/user');
		}
	}
	
	public startGameLoop(msg: MessageEvent): void {
		if (!msg || !msg.data) {
			console.error("No message data to start game loop");
			return;
		}
		this._inputHandler.setupEventListeners();
		console.log("game loop started")
		this._intervalId = setInterval(() => { this.update(); }, 16);
		//roughly 60fps
		
		this.parseMessage(msg);

		// Attach unload confirmation and cancel behavior only while game is active
		try {
			this._beforeUnloadHandler = (e: BeforeUnloadEvent) => {
				// Suggest leaving; don't send cancel here (user may cancel the dialog)
				// Update URL so the next load lands on /user instead of /user/game
				try { history.replaceState(null, '', '/user'); } catch {}
				try { localStorage.setItem('navigate_to_user', '1'); } catch {}
				e.preventDefault();
				e.returnValue = '';
				return '';
			};
			window.addEventListener('beforeunload', this._beforeUnloadHandler, { capture: true });
			this._pageHideHandler = () => {
				try {
					// Avoid sending cancel for local games (no real backend room)
					const isLocalRoom = !this._roomID || String(this._roomID) === 'local';
					if (this._roomID && !isLocalRoom) {
						const cancelMsg = { type: 5, roomId: this._roomID, status: 'cancel' };
						this._ws.sendMessage(JSON.stringify(cancelMsg));
						// Mark for forced cancel on next WS reconnect in case the ws is already closed
						try { localStorage.setItem('force_cancel_room_id', String(this._roomID)); } catch {}
						// After sending cancel, switch route to /user via SPA if available
						try { history.replaceState(null, '', '/user'); } catch {}
					}
				} catch {}
			};
			window.addEventListener('pagehide', this._pageHideHandler, { capture: true });
		} catch {}

		switch (this._oppModeStr) {
			case 'single':
				this._oppMode = OpponentMode.SINGLE;
				break;
			case 'multi':
				this._oppMode = OpponentMode.MULTI;
				break;
			case 'online':
				this._oppMode = OpponentMode.ONLINE;
				break;
			default:
				console.error('Invalid opponent mode:', this._oppModeStr, " defaulting to single");
				this._oppMode = OpponentMode.SINGLE;
				break;
		}
		switch (this._gameModeStr) {
			case 'infinite':
				this._gameMode = GameMode.INFINITE;
				break;
			case 'bestof':
				this._gameMode = GameMode.BEST_OF;
				break;
			case 'tournament':
				this._gameMode = GameMode.TOURNAMENT;
				break;
			case 'teams':
				this._gameMode = GameMode.TEAMS;
				break;
			case 'breakout' :
				this._gameMode = GameMode.BREAKOUT;
				break;
			default:
				console.error('Invalid game mode:', this._gameModeStr, " defaulting to mode select");
				this._gameModeStr = "default";
				break;
		}
		if (this._gameModeStr == "default") {
			this._inputHandler._oppMode = this._oppMode;
			this._gameStateMachine.transition(GameState.SELECT);
			return;
		}
		this._gameStateMachine.transition(GameState.GAME);
		this.startGame(this._gameMode, this._oppMode);
	}

	private update(): void {
		this._gameStateMachine.update();
	}
}

export default GameEngine;