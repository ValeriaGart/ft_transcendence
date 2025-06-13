import { CollisionHandler } from './collisionDetection.js';
import { RenderEngine } from './renderEngine.js';
import { getRandomAngle, getRandomDirection } from './utils.js';
import { PauseScreen } from './pauseScreen.js';
import { Player } from './player.js';
import { WinScreen } from './winScreen.js';
import GameEngine from './gameEngine.js';

import { GameMode, GameState, GameStats, OpponentMode, PaddleSide } from '../types.js';
import { BALL_SPEED, PADDLE_HEIGHT } from '../constants.js';

export class PongGame {
	//custom interfaces
	public	gameStats: GameStats;
	public readonly paddleSides: PaddleSide[] = ['left', 'right'];

	//custom classes
	private collisionHandler: CollisionHandler;
	public renderEngine: RenderEngine;
	public pauseScreen: PauseScreen
	public engine: GameEngine;
	private _winScreen: WinScreen

	//variables
	public _mode: GameMode;
	public _oppMode: OpponentMode;
	public _p1: Player;
	public _p2: Player;
	private _round: number = 0;

	constructor(engine: GameEngine, mode: GameMode, opponent: OpponentMode, p1: Player, p2: Player, round?: number) {
		this.engine = engine;
		this._mode = mode
		this._oppMode = opponent;
		this._p1 = p1;
		this._p2 = p2;
		this._round = round || this._round;

		console.log('game running in mode: ', this._mode);
		console.log(this._oppMode);

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
		this._winScreen = new WinScreen(this);
	}

	public drawGameScreen(): void {
		this.gameStats.ballPosition.x += this.gameStats.ballVelocity.x;
		this.gameStats.ballPosition.y += this.gameStats.ballVelocity.y;

		if (this._oppMode == OpponentMode.SINGLE) {
			this._p2.AI.update(this);
		}

		this.renderEngine.renderFrame();

		this.collisionHandler.checkCollisions();
		if (this._mode == GameMode.BEST_OF || this._mode == GameMode.TOURNAMENT) {
			if (this.checkWinCondition()) {
				switch (this._round) {
					case 1:
						this.engine.startRoundTwo();
						break;
					case 2:
						this.engine.startRoundThree();
						break;
					case 3:
						this.engine.startRoundFour();
						break;
					case 4:
						this.engine.endTournament();
						break;
				}
			}
		}
	}

	private checkWinCondition(): boolean {
		if (this.gameStats.scores.left >= 3) {
			this._p1.setPosition(this._p1.getPosition() - 1)
			console.log('winner: ', this._p1.getName(), " pos: ", this._p1.getPosition());
			if (this._mode == GameMode.TOURNAMENT) {
				return true;
			}
			this.engine.gameStateMachine.transition(GameState.GAME_OVER);
			this._winScreen.drawWinScreen(this._p1.getName());
			return false;
		}
		
		if (this.gameStats.scores.right >= 3) {
			this._p2.setPosition(this._p2.getPosition() - 1)
			console.log('winner: ', this._p2.getName(), " pos: ", this._p2.getPosition());
			if (this._mode == GameMode.TOURNAMENT) {
				return true;
			}
			this.engine.gameStateMachine.transition(GameState.GAME_OVER);
			this._winScreen.drawWinScreen(this._p2.getName());
			return false;
		}
		return false;
	}
}