import GameEngine from './gameEngine.ts';
import { GameMode, GameState, type GameStats, OpponentMode, type PaddleSide } from './types.ts';
import { BALL_SPEED, PADDLE_HEIGHT, PADDLE_SPEED } from './constants.ts';
import { CollisionHandler } from './collisionDetection.ts';
import { RenderEngine } from './renderEngine.ts';
// import { getRandomAngle, getRandomDirection } from './utils.ts';
import { PauseScreen } from './pauseScreen.ts';
import { Player } from './player.ts';
import { WinScreen } from './winScreen.ts';

const BROADCAST_INTERVAL_MS = 16;
const AI_INTERVAL_MS = 1000;

export class PongGame {
	//custom interfaces
	public	_gameStats: GameStats;
	public readonly _paddleSides: PaddleSide[] = ['left', 'right'];

	//custom classes
	private _collisionHandler: CollisionHandler;
	public _renderEngine: RenderEngine;
	public _pauseScreen: PauseScreen
	public _engine: GameEngine;
	private _winScreen: WinScreen

	//variables
	public _mode: GameMode = GameMode.INFINITE;
	public _oppMode: OpponentMode = OpponentMode.SINGLE;
	public _p1: Player;
	public _p2: Player;
	public _p3: Player | null = null;
	public _p4: Player | null = null;
	private _round: number = 0;
	private _lastAIUpdateTimeMs: number = 0;
	private _lastBroadcastTimeMs: number = 0;
	private _running: boolean = true;

	constructor(engine: GameEngine, mode: GameMode, opponent: OpponentMode, p1?: Player, p2?: Player, p3?: Player, p4?: Player, round?: number) {
		this._engine = engine;
		this._mode = mode || this._mode
		this._oppMode = opponent || this._oppMode;
		this._p1 = p1 || new Player("default", 0, true, 1);
		this._p1.setSide('left');
		this._p2 = p2 || new Player("default", 0, true, 2);
		this._p2.setSide('right');
		this._p3 = p3 || null;
		if (this._p3)
			this._p3.setSide('default');
		this._p4 = p4 || null;
		if (this._p4)
			this._p4.setSide('default');
		this._round = round || this._round;

		console.log('game running in mode: ', this._mode, " : ", this._oppMode);

		// const randomDirection = getRandomDirection();
		// const randomAngle = getRandomAngle()
		const speed = BALL_SPEED;
		this._gameStats = {
			ballPosition: { x: this._engine._canvas.width / 2, y: this._engine._canvas.height / 2},
			// ballVelocity: { x: randomDirection * Math.cos(randomAngle) * speed, y: Math.sin(randomAngle) * speed},
			ballVelocity: { x: -1 * speed, y: 0 * speed},
			paddlePositions: { left: (this._engine._canvas.height / 2) - (PADDLE_HEIGHT / 2), right: (this._engine._canvas.height / 2) - (PADDLE_HEIGHT / 2)},
			paddleDirection: {left: 0, right: 0},
			paddleVelocity: { left :0, right: 0},
			scores: { left: 0, right: 0},
			pnumber: this._engine._urp
		};
		this._collisionHandler = new CollisionHandler(this);
		this._renderEngine = new RenderEngine(this);
		this._pauseScreen = new PauseScreen(this._engine);
		this._winScreen = new WinScreen(this);

		this._engine._ws.ws.onmessage = (message) => {
			this.parseMessage(message);
		}
	}

	public drawGameScreen(): void {
		this._gameStats.paddleVelocity.left = this._gameStats.paddleDirection.left * PADDLE_SPEED;
		if (this._gameStats.paddlePositions.left + this._gameStats.paddleVelocity.left > 0
			&& this._gameStats.paddlePositions.left + this._gameStats.paddleVelocity.left < this._engine._canvas.height - PADDLE_HEIGHT) {
			this._gameStats.paddlePositions.left += this._gameStats.paddleVelocity.left;
		}
		this._gameStats.paddleVelocity.right = this._gameStats.paddleDirection.right * PADDLE_SPEED;
		if (this._gameStats.paddlePositions.right + this._gameStats.paddleVelocity.right > 0
		&& this._gameStats.paddlePositions.right + this._gameStats.paddleVelocity.right < this._engine._canvas.height - PADDLE_HEIGHT) {
			this._gameStats.paddlePositions.right += this._gameStats.paddleVelocity.right;
		}

		this._gameStats.ballPosition.x += this._gameStats.ballVelocity.x;
		this._gameStats.ballPosition.y += this._gameStats.ballVelocity.y;

		if (this._lastAIUpdateTimeMs === 0 || Date.now() - this._lastAIUpdateTimeMs > AI_INTERVAL_MS) {
			if (this._p1.isBot() == true) {
				this._p1._AI.update(this);
			}
			if (this._p2.isBot() == true) {
				this._p2._AI.update(this);
			}
			this._lastAIUpdateTimeMs = Date.now();
		}

		this._renderEngine.renderFrame();

		this._collisionHandler.checkCollisions();
		if (this._mode == GameMode.BEST_OF || this._mode == GameMode.TOURNAMENT) {
			if (this.checkWinCondition()) {
				switch (this._round) {
					case 1:
						this._engine.startRoundTwo();
						break;
					case 2:
						this._engine.startTournamentMiddle();
						break;
					case 3:
						this._engine.startRoundFour();
						break;
					case 4:
						this._engine.endTournament();
						break;
				}
			}
		}

		if (this._oppMode == OpponentMode.ONLINE && (this._lastBroadcastTimeMs === 0 || Date.now() - this._lastBroadcastTimeMs > BROADCAST_INTERVAL_MS)) {
			this.broadcastGameState();
			this._lastBroadcastTimeMs = Date.now();
		}
	}

	private broadcastGameState(): void {
		if ((this._gameStats.pnumber != this._p1.getPnumber() && this._gameStats.pnumber != this._p2.getPnumber()) || this._running == false) {
			return;
		}
		const msg = {
			"type": 7,
			"roomId": this._engine._roomID,
			"_gameState": this._gameStats
		};
		const gameStateString = JSON.stringify(msg);
		this._engine._ws.sendMessage(gameStateString);
		// console.log('client has sent message: ', gameStateString);
	}

	private parseMessage(message: MessageEvent): void {
		if (this._running == false) {
			return;
		}
		var msg = JSON.parse(message.data);
		if (msg == "pause") {
			this._engine._gameStateMachine.transition(GameState.PAUSED);
		}
		// console.log('client has reveived message: ', msg);
		if (msg.type == "CANCELMATCH") {
			this._engine.endGameLoop();
		}
		if (!msg.ballPosition) {
			return;
		}
		if (this._gameStats.pnumber == this._p2.getPnumber()) {
			this._gameStats.paddlePositions.left = msg.paddlePositions.left;
			this._gameStats.scores = msg.scores;
			if (this._gameStats.ballPosition.x <= this._engine._canvas.width / 2) {
				this._gameStats.ballPosition = msg.ballPosition;
				this._gameStats.ballVelocity = msg.ballVelocity;
			}
		}
		else if (this._gameStats.pnumber == this._p1.getPnumber()) {
			this._gameStats.paddlePositions.right = msg.paddlePositions.right;
			if (this._gameStats.ballPosition.x > this._engine._canvas.width / 2) {
				this._gameStats.ballPosition = msg.ballPosition;
				this._gameStats.ballVelocity = msg.ballVelocity;
			}
		}
		else {
			this._gameStats.paddlePositions.left = msg.paddlePositions.left;
			this._gameStats.paddlePositions.right = msg.paddlePositions.right;
			this._gameStats.scores = msg.scores;
			this._gameStats.ballPosition = msg.ballPosition;
			this._gameStats.ballVelocity = msg.ballVelocity;
		}
	}

	private sendFinishMessage() {
		if (this._gameStats.pnumber == this._p1.getPnumber() && this._mode == GameMode.BEST_OF && this._oppMode == OpponentMode.ONLINE) {
			const msg = {
				"type": 6,
				"roomId": this._engine._roomID,
				"players": [{ "nick": this._p1.getName(), "score": this._gameStats.scores.left }, { "nick": this._p2.getName(), "score": this._gameStats.scores.right }]
			}
			console.log('Sending finish & save match msg:', JSON.stringify(msg));
			this._engine._ws.sendMessage(JSON.stringify(msg));
		}
	}

	private checkWinCondition(): boolean {
		if (this._gameStats.scores.left >= 3) {
			this._running = false;
			this._p1.setPosition(this._p1.getPosition() - 1)
			console.log('winner: ', this._p1.getName(), " pos: ", this._p1.getPosition());
			if (this._mode == GameMode.TOURNAMENT) {
				return true;
			}
			this._engine._gameStateMachine.transition(GameState.GAME_OVER);
			this._winScreen.drawWinScreen(this._p1.getName());
			this.sendFinishMessage();
			return false;
		}
		
		if (this._gameStats.scores.right >= 3) {
			this._running = false;
			this._p2.setPosition(this._p2.getPosition() - 1)
			console.log('winner: ', this._p2.getName(), " pos: ", this._p2.getPosition());
			if (this._mode == GameMode.TOURNAMENT) {
				return true;
			}
			this._engine._gameStateMachine.transition(GameState.GAME_OVER);
			this._winScreen.drawWinScreen(this._p2.getName());
			this.sendFinishMessage();
			return false;
		}
		return false;
	}
}