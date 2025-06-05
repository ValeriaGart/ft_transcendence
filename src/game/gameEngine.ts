import { BALL_SPEED, PADDLE_HEIGHT } from '../constants.js';
import { CollisionHandler } from './collisionDetection.js';
import { InputHandler } from './inputHandler.js';
import { RenderEngine } from './renderEngine.js';
import { getRandomAngle, getRandomDirection } from './utils.js';

export class PongGame {
	//standard classes
	public readonly canvas: HTMLCanvasElement;
	public readonly ctx: CanvasRenderingContext2D;

	//custom interfaces
	public	gameState: GameState;
	public readonly paddleSides: PaddleSide[] = ['left', 'right'];

	//custom classes
	private collisionHandler: CollisionHandler;
	private inputHandler: InputHandler;
	private renderEngine: RenderEngine;

	constructor(canvasID: string) {
		this.canvas = document.getElementById(canvasID) as HTMLCanvasElement;
		this.ctx = this.canvas.getContext('2d')!;

		this.canvas.height = 900;
		this.canvas.width = 1600;

		console.log('Canvas width: ', this.canvas.width);
		console.log('Canvas height: ', this.canvas.height);
		console.log('Context: ', this.ctx);

		const randomDirection = getRandomDirection();
		const randomAngle = getRandomAngle()
		const speed = BALL_SPEED;
		this.gameState = {
			ballPosition: { x: this.canvas.width / 2, y: this.canvas.height / 2},
			ballVelocity: { x: randomDirection * Math.cos(randomAngle) * speed, y: Math.sin(randomAngle) * speed},
			paddlePositions: { left: (this.canvas.height / 2) - (PADDLE_HEIGHT / 2), right: (this.canvas.height / 2) - (PADDLE_HEIGHT / 2)},
			scores: { left: 0, right: 0}
		};
		this.collisionHandler = new CollisionHandler(this);
		this.inputHandler = new InputHandler(this);
		this.renderEngine = new RenderEngine(this);

		this.inputHandler.setupEventListeners();
	}

	public startGameLoop(): void {
		console.log("game loop started")
		setInterval(() => this.update(), 16);
		//roughly 60fps
	}

	private update(): void {
		this.gameState.ballPosition.x += this.gameState.ballVelocity.x;
		this.gameState.ballPosition.y += this.gameState.ballVelocity.y;

		this.collisionHandler.checkCollisions();

		this.renderEngine.renderFrame();
	}
}

export default PongGame;