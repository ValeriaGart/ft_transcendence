import { GameMode, GameState, OpponentMode } from '../types.js';
import { GameStateMachine } from './gameStateMachine.js';
import { SelectScreen } from './selectScreen.js';
import { StartScreen } from './startScreen.js';
import { InputHandler } from './inputHandler.js';
import { PongGame } from './pongGame.js';
import { Player } from './player.js';
import { Tournament } from './tournament.js';

export class GameEngine {
	//standard classes
	public readonly _canvas: HTMLCanvasElement;
	public readonly _ctx: CanvasRenderingContext2D;

	//custom classes
	public _startScreen: StartScreen;
	public _selectScreen: SelectScreen;
	public _gameStateMachine: GameStateMachine;
	public _pongGame: PongGame;
	private _inputHandler: InputHandler;
	private _tournament: Tournament | undefined = undefined;

	constructor(canvasID: string) {
		this._canvas = document.getElementById(canvasID) as HTMLCanvasElement;
		this._ctx = this._canvas.getContext('2d')!;

		this._canvas.height = 900;
		this._canvas.width = 1600;

		console.log('Canvas width: ', this._canvas.width);
		console.log('Canvas height: ', this._canvas.height);
		console.log('Context: ', this._ctx);


		this._startScreen = new StartScreen(this);
		this._selectScreen = new SelectScreen(this);
		this._gameStateMachine = new GameStateMachine(this);
		this._pongGame = new PongGame(this);
		this._inputHandler = new InputHandler(this);
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
			var p1: Player = new Player('Player1', 4, false);
			var p2: Player = new Player('Bot1', 4, true);
			var p3: Player = new Player('Bot2', 4, true);
			var p4: Player = new Player('Bot3', 4, true);

			this._tournament = new Tournament(this, p1, p2, p3, p4, mode, oppMode);
			this._tournament.battleOne();
		}
		if (oppMode == OpponentMode.MULTI) {
			//todo
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
			var playerOne: Player = new Player('Player1', 0, false);
			var playerTwo: Player = new Player('Bot1', 0, true);
			this._pongGame = new PongGame(this, mode, oppMode, playerOne, playerTwo);
		}
		if (oppMode == OpponentMode.MULTI) {
			var playerOne: Player = new Player('Player1', 0, false);
			var playerTwo: Player = new Player('Player2', 0, false);
			this._pongGame = new PongGame(this, mode, oppMode, playerOne, playerTwo);
		}
	}
	
	public startGameLoop(): void {
		this._inputHandler.setupEventListeners();
		console.log("game loop started")
		const setIntervalId = setInterval(() => { this.update(); }, 16);
		//roughly 60fps
		
	}

	private update(): void {
		this._gameStateMachine.update();
	}
}

export default GameEngine;