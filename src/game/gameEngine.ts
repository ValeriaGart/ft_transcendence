import { GameStateMachine } from './gameStateMachine.js';
import { SelectScreen } from './selectScreen.js';
import { StartScreen } from './startScreen.js';
import { InputHandler } from './inputHandler.js';
import { PongGame } from './pongGame.js';
import { GameState } from '../types.js';

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
		this.pongGame = new PongGame(this, 0);
		this.inputHandler = new InputHandler(this);
		
	}
	
	public startGame(mode: number): void {
		this.pongGame = new PongGame(this, mode);
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