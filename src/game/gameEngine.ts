import { GameStateMachine } from './gameStateMachine.js';
import { SelectScreen } from './selectScreen.js';
import { StartScreen } from './startScreen.js';
import { InputHandler } from './inputHandler.js';
import { PongGame } from './pongGame.js';
import { GameMode, GameState, OpponentMode } from '../types.js';
import { OPEN } from 'ws';
import { Player } from './player.js';
import { BotAI } from './botAI.js';

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
		this.pongGame = new PongGame(this, GameMode.INFINITE, OpponentMode.SINGLE, new Player('def', 0, true), new Player('def', 0, true));
		this.inputHandler = new InputHandler(this);
		
	}
	
	public startGame(mode: GameMode): void {
		//!!!	this needs to be passed from select screen	!!!
		var opponent: OpponentMode = OpponentMode.SINGLE;
		//!!!	this needs to be passed from select screen	!!!
		if (mode == GameMode.TOURNAMENT) {
			this.tournamentHandler(mode, opponent);
		}
		else {
			this.singleGameHandler(mode, opponent);
		}
	}
	
	private tournamentHandler(mode: GameMode, opponent: OpponentMode):void {
		var playerOne: Player = new Player('Player1', 4, false);
		var playerTwo: Player = new Player('Bot1', 4, true);
		var playerThree: Player = new Player('Bot2', 4, true);
		var playerFour: Player = new Player('Bot3', 4, true);
	}
	
	private singleGameHandler(mode: GameMode, opponent: OpponentMode):void {
		switch(opponent) {
			case OpponentMode.SINGLE:
				var playerOne: Player = new Player('Player1', 0, false);
				var playerTwo: Player = new Player('Bot1', 0, true);
				// var playerTwo: Player = new Player('Bot1', 0);
				this.pongGame = new PongGame(this, mode, opponent, playerOne, playerTwo);
				break;
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