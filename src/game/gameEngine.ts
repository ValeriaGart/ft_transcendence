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

export class GameEngine {
	//standard classes
	public readonly _canvas: HTMLCanvasElement;
	public readonly _ctx: CanvasRenderingContext2D;

	//custom classes
	public _startScreen: StartScreen;
	public _opponentScreen: OpponentScreen
	public _selectScreen: SelectScreen;
	public _gameStateMachine: GameStateMachine;
	public _pongGame: PongGame;
	private _inputHandler: InputHandler;
	private _tournament: Tournament | undefined = undefined;

	//game variables
	public _roomID: string | null = null;
	private p1Nick: string | null = null;
	private p2Nick: string | null = null;
	private p3Nick: string | null = null;
	private p4Nick: string | null = null;
	private p1AI: boolean = true;
	private p2AI: boolean = true;
	private p3AI: boolean = true;
	private p4AI: boolean = true;
	private gameMode: string | null = null;
	private oppMode: string | null = null;

	public _ws = WebSocketService.getInstance();


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
		this._pongGame = new PongGame(this);
		this._inputHandler = new InputHandler(this);
	}
	
	public startGame(mode: GameMode, oppMode: OpponentMode): void {
		if (mode == GameMode.TOURNAMENT) {
			this.tournamentHandler(mode, oppMode);
		}
		else {
			this.singleGameHandler(mode, oppMode);
		}
	}
	
	private tournamentHandler(mode: GameMode, oppMode: OpponentMode): void {
		if (oppMode == OpponentMode.SINGLE) {
			var p1: Player = new Player(this.p1Nick ?? 'player', 4, false);
			var p2: Player = new Player('bot1', 4, true);
			var p3: Player = new Player('bot2', 4, true);
			var p4: Player = new Player('bot3', 4, true);

			this._tournament = new Tournament(this, p1, p2, p3, p4, mode, oppMode);
			this._tournament.battleOne();
		}
		if (oppMode == OpponentMode.MULTI) {
			var p1: Player = new Player(this.p1Nick ?? 'player', 4, this.p1AI);
			var p2: Player = new Player(this.p2Nick ?? 'bot3', 4, this.p2AI);
			var p3: Player = new Player(this.p3Nick ?? 'bot2', 4, this.p3AI);
			var p4: Player = new Player(this.p4Nick ?? 'bot1', 4, this.p4AI);

			this._tournament = new Tournament(this, p1, p2, p3, p4, mode, oppMode);
			this._tournament.battleOne();
		}
	}

	public startRoundTwo(): void {
		this._tournament?.battleTwo();
	}

	public startTournamentMiddle(): void {
		this._tournament?.tournamentMiddle();
	}

	public startRoundThree(): void {
		this._tournament?.battleThree();
	}

	public startRoundFour(): void {
		this._tournament?.battleFour();
	}

	public endTournament(): void {
		this._tournament?.winScreen();
	}
	
	private singleGameHandler(mode: GameMode, oppMode: OpponentMode): void {
		if (oppMode == OpponentMode.SINGLE) {
			var playerOne: Player = new Player(this.p1Nick ?? 'player', 0, false);
			var playerTwo: Player = new Player(this.p2Nick ?? 'bot', 0, true);
			this._pongGame = new PongGame(this, mode, oppMode, playerOne, playerTwo);
		}
		if (oppMode == OpponentMode.MULTI) {
			var playerOne: Player = new Player(this.p1Nick ?? 'player1', 0, false);
			var playerTwo: Player = new Player(this.p2Nick ?? 'player2', 0, false);
			this._pongGame = new PongGame(this, mode, oppMode, playerOne, playerTwo);
		}
	}

	private parseMessage(message: MessageEvent){
		var msg
		msg = JSON.parse(message.data);

		this._roomID = msg.roomId;
		this.p1Nick = msg.players[0].nick;
		this.p2Nick = msg.players[1].nick;
		this.p3Nick = msg.players[2]?.nick || null;
		this.p4Nick = msg.players[3]?.nick || null;
		this.p1AI = msg.players[0].ai;
		this.p2AI = msg.players[1].ai;
		this.p3AI = msg.players[2]?.ai || true;
		this.p4AI = msg.players[3]?.ai || true;
		this.gameMode = msg.gameMode;
		this.oppMode = msg.oppMode;
		console.log('id: ', this._roomID);
		console.log('p1: ', this.p1Nick, ' AI: ', this.p1AI);
		console.log('p2: ', this.p2Nick, ' AI: ', this.p2AI);
		console.log('game mode: ', this.gameMode);
		console.log('opponent mode: ', this.oppMode);
	}
	
	public startGameLoop(msg: MessageEvent): void {
		if (!msg || !msg.data) {
			console.error("No message data to start game loop");
			return;
		}
		this._inputHandler.setupEventListeners();
		console.log("game loop started")
		const setIntervalId = setInterval(() => { this.update(); }, 16);
		//roughly 60fps
		
		this.parseMessage(msg);

		var omode: OpponentMode = OpponentMode.SINGLE;
		var gmode: GameMode = GameMode.INFINITE;

		switch (this.oppMode) {
			case 'single':
				omode = OpponentMode.SINGLE;
				break;
			case 'multi':
				omode = OpponentMode.MULTI;
				break;
			case 'online':
				omode = OpponentMode.ONLINE;
				break;
			default:
				console.error('Invalid opponent mode:', this.oppMode, " defaulting to single");
				omode = OpponentMode.SINGLE;
				break;
		}
		switch (this.gameMode) {
			case 'infinite':
				gmode = GameMode.INFINITE;
				break;
			case 'bestof':
				gmode = GameMode.BEST_OF;
				break;
			case 'tournament':
				gmode = GameMode.TOURNAMENT;
				break;
			default:
				console.error('Invalid game mode:', this.gameMode, " defaulting to mode select");
				this.gameMode = "default";
				break;
		}
		if (this.gameMode == "default") {
			this._inputHandler._oppMode = omode;
			this._gameStateMachine.transition(GameState.SELECT);
			return;
		}
		this._gameStateMachine.transition(GameState.GAME);
		this.startGame(gmode, omode);
	}

	private update(): void {
		this._gameStateMachine.update();
	}
}

export default GameEngine;