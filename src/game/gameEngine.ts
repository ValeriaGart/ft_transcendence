import { GameStateMachine } from './gameStateMachine.js';
import { SelectScreen } from './selectScreen.js';
import { StartScreen } from './startScreen.js';
import { InputHandler } from './inputHandler.js';
import { PongGame } from './pongGame.js';
import { GameMode, GameState, OpponentMode } from '../types.js';
import { Player } from './player.js';
import { Tournament } from './tournament.js';

export class GameEngine {
	//standard classes
	public readonly canvas: HTMLCanvasElement;
	public readonly ctx: CanvasRenderingContext2D;

	//custom classes
	public startScreen: StartScreen;
	public selectScreen: SelectScreen;
	public gameStateMachine: GameStateMachine;
	public pongGame: PongGame;
	private inputHandler: InputHandler;
	private _tournament: Tournament | undefined = undefined;

	constructor(canvasID: string) {
		this.canvas = document.getElementById(canvasID) as HTMLCanvasElement;
		this.ctx = this.canvas.getContext('2d')!;

		this.canvas.height = 900;
		this.canvas.width = 1600;

		console.log('Canvas width: ', this.canvas.width);
		console.log('Canvas height: ', this.canvas.height);
		console.log('Context: ', this.ctx);


		this.startScreen = new StartScreen(this);
		this.selectScreen = new SelectScreen(this);
		this.gameStateMachine = new GameStateMachine(this);
		this.pongGame = new PongGame(this, GameMode.INFINITE, OpponentMode.SINGLE, new Player('def', 0, true, 'left'), new Player('def', 0, true, 'right'));
		// this._tournament = undefined;
		this.inputHandler = new InputHandler(this);
	}
	
	public startGame(mode: GameMode): void {
		//!!!	this needs to be passed from select screen	!!!
		var oppMode: OpponentMode = OpponentMode.SINGLE;
		//!!!	this needs to be passed from select screen	!!!
		if (mode == GameMode.TOURNAMENT) {
			this.tournamentHandler(mode, oppMode);
		}
		else {
			this.singleGameHandler(mode, oppMode);
		}
	}
	
	private tournamentHandler(mode: GameMode, oppMode: OpponentMode): void {
		if (oppMode == OpponentMode.SINGLE) {
			var p1: Player = new Player('Player1', 4, false, 'left');
			var p2: Player = new Player('Bot1', 4, true, 'left');
			var p3: Player = new Player('Bot2', 4, true, 'left');
			var p4: Player = new Player('Bot3', 4, true, 'left');

			this._tournament = new Tournament(this, p1, p2, p3, p4, mode, oppMode);
			this._tournament.BattleOne();
		}
		if (oppMode == OpponentMode.MULTI) {
			//todo
		}
	}

	public startRoundTwo(): void {
		this._tournament?.BattleTwo();
	}

	public startTournamentMiddle(): void {
		this._tournament?.TournamentMiddle();
	}

	public startRoundThree(): void {
		this._tournament?.BattleThree();
	}

	public startRoundFour(): void {
		this._tournament?.BattleFour();
	}

	public endTournament(): void {
		this._tournament?.WinScreen();
	}
	
	private singleGameHandler(mode: GameMode, oppMode: OpponentMode): void {
		if (oppMode == OpponentMode.SINGLE) {
			var playerOne: Player = new Player('Player1', 0, false, 'left');
			var playerTwo: Player = new Player('Bot1', 0, true, 'right');
			this.pongGame = new PongGame(this, mode, oppMode, playerOne, playerTwo);
		}
		if (oppMode == OpponentMode.MULTI) {
			var playerOne: Player = new Player('Player1', 0, false, 'left');
			var playerTwo: Player = new Player('Player2', 0, false, 'right');
			this.pongGame = new PongGame(this, mode, oppMode, playerOne, playerTwo);
		}
	}
	
	public startGameLoop(): void {
		this.inputHandler.setupEventListeners();
		console.log("game loop started")
		const setIntervalId = setInterval(() => { this.update(); }, 16);
		//roughly 60fps
		
	}

	private update(): void {
		this.gameStateMachine.update();
	}
}

export default GameEngine;