import { CollisionHandler } from './collisionDetection.js';
import { RenderEngine } from './renderEngine.js';
import { getRandomAngle, getRandomDirection } from './utils.js';
import { PauseScreen } from './pauseScreen.js';
import GameEngine from './gameEngine.js';
import { Player } from './player.js';

import { GameMode, GameState, GameStats, OpponentMode, PaddleSide } from '../types.js';
import { BALL_SPEED, PADDLE_HEIGHT } from '../constants.js';
import { BotAI } from './botAI.js';

export class PongGame {
	//custom interfaces
	public	gameStats: GameStats;
	public readonly paddleSides: PaddleSide[] = ['left', 'right'];

	//custom classes
	private collisionHandler: CollisionHandler;
	public renderEngine: RenderEngine;
	public pauseScreen: PauseScreen
	public engine: GameEngine;

	//variables
	public mode: GameMode;
	public _opponent: OpponentMode;
	public _p1: Player;
	public _p2: Player;

	constructor(engine: GameEngine, mode: GameMode, opponent: OpponentMode, p1: Player, p2: Player) {
		this.engine = engine;
		this.mode = mode
		this._opponent = opponent;
		this._p1 = p1;
		this._p2 = p2;

		console.log('game running in mode: ', this.mode);
		console.log(this._opponent);

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
		this.pauseScreen = new PauseScreen(this.engine);
	}

	public drawGameScreen(): void {
		this.gameStats.ballPosition.x += this.gameStats.ballVelocity.x;
		this.gameStats.ballPosition.y += this.gameStats.ballVelocity.y;

		if (this._opponent == OpponentMode.SINGLE) {
			this._p2.AI.update(this);
		}

		this.collisionHandler.checkCollisions();
		if (this.mode == GameMode.BEST_OF) {
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