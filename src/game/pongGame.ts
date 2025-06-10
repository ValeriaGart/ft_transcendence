import { CollisionHandler } from './collisionDetection.js';
import { RenderEngine } from './renderEngine.js';
import { getRandomAngle, getRandomDirection } from './utils.js';
import GameEngine from './gameEngine.js';

import { GameState, GameStats, PaddleSide } from '../types.js';
import { BALL_SPEED, PADDLE_HEIGHT } from '../constants.js';

export class PongGame {
	//custom interfaces
	public	gameStats: GameStats;
	public readonly paddleSides: PaddleSide[] = ['left', 'right'];

	//custom classes
	private collisionHandler: CollisionHandler;
	public renderEngine: RenderEngine;
	public engine: GameEngine;

	//variables
	public isPaused: boolean = false;
	public mode: number;

	constructor(engine: GameEngine, mode: number) {
		this.engine = engine;
		this.mode = mode

		const randomDirection = getRandomDirection();
		const randomAngle = getRandomAngle()
		const speed = BALL_SPEED;
		this.gameStats = {
			ballPosition: { x: this.engine.canvas.width / 2, y: this.engine.canvas.height / 2},
			ballVelocity: { x: randomDirection * Math.cos(randomAngle) * speed, y: Math.sin(randomAngle) * speed},
			paddlePositions: { left: (this.engine.canvas.height / 2) - (PADDLE_HEIGHT / 2), right: (this.engine.canvas.height / 2) - (PADDLE_HEIGHT / 2)},
			scores: { left: 0, right: 0}
		};
		this.collisionHandler = new CollisionHandler(this);
		this.renderEngine = new RenderEngine(this);
	}

	public drawGameScreen(): void {
		this.gameStats.ballPosition.x += this.gameStats.ballVelocity.x;
		this.gameStats.ballPosition.y += this.gameStats.ballVelocity.y;

		this.collisionHandler.checkCollisions();
		if (this.mode = 1) {
			this.checkWinCondition();
		}
		this.renderEngine.renderFrame();
	}

	private checkWinCondition(): void {
		if (this.gameStats.scores.left >= 3 || this.gameStats.scores.right >= 3) {
			this.engine.gameStateMachine.transition(GameState.SELECT);
		}
	}
}