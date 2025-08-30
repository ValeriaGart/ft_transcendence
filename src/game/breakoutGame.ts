import GameEngine from './gameEngine.ts';
import { type BreakoutStats, GameMode, GameState, OpponentMode, type PaddleSide } from './types.ts';
import { BALL_SPEED, BLOCK_COLLUMNS, BLOCK_ROWS, EXTRA_PADDLE_HEIGHT, EXTRA_PADDLE_SPEED, PADDLE_HEIGHT, PADDLE_SPEED } from './constants.ts';
import { PauseScreen } from './pauseScreen.ts';
import { Player } from './player.ts';
import { WinScreen } from './winScreen.ts';
import { BreakoutRenderEngine } from './breakoutRenderEngine.ts';
import { BreakoutCollisionHandler } from './breakoutCollisionDetection.ts';

const BROADCAST_INTERVAL_MS = 16;

export class BreakoutGame {
	//custom interfaces
	public	_gameStats: BreakoutStats;
	public readonly _paddleSides: PaddleSide[] = ['left', 'right'];

	//custom classes
	private _collisionHandler: BreakoutCollisionHandler;
	public _renderEngine: BreakoutRenderEngine;
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
	private _lastBroadcastTimeMs: number = 0;
	private _running: boolean = true;
	public _blocks: boolean[][] = new Array(BLOCK_ROWS).fill(true).map(() => new Array(BLOCK_COLLUMNS).fill(true));
	public _blocks2: boolean[][] = new Array(BLOCK_ROWS).fill(true).map(() => new Array(BLOCK_COLLUMNS).fill(true));

	constructor(engine: GameEngine, mode: GameMode, opponent: OpponentMode, p1?: Player, p2?: Player) {
		this._engine = engine;
		this._mode = mode || this._mode
		this._oppMode = opponent || this._oppMode;
		this._p1 = p1 || new Player("default", 0, true, 1);
		this._p1.setSide('left');
		this._p2 = p2 || new Player("default", 0, true, 2);
		this._p2.setSide('right');
		console.log('game running in mode: ', this._mode, " : ", this._oppMode);

		const speed = BALL_SPEED;
		this._gameStats = {
			ball1Position: {x: this._engine._canvas.width / 4, y: this._engine._canvas.height / 2},
			ball1Velocity: {x: 0 * speed, y: 1 * speed},
			ball2Position: {x: (this._engine._canvas.width / 4) * 3, y: this._engine._canvas.height / 2},
			ball2Velocity: {x: 0 * speed, y: 1 * speed},
			paddlePositions: { left: (this._engine._canvas.width / 4) - (PADDLE_HEIGHT / 2), right: ((this._engine._canvas.width / 4) * 3) - (PADDLE_HEIGHT / 2)},
			paddleDirection: {left: 0, right: 0},
			paddleVelocity: { left :0, right: 0},
			scores: { left: BLOCK_ROWS * BLOCK_COLLUMNS, right: BLOCK_ROWS * BLOCK_COLLUMNS},
			pnumber: this._engine._urp
		}
		this._collisionHandler = new BreakoutCollisionHandler(this);
		this._renderEngine = new BreakoutRenderEngine(this);
		this._pauseScreen = new PauseScreen(this._engine);
		this._winScreen = new WinScreen(this);

		this._engine._ws.ws.onmessage = (message) => {
			this.parseMessage(message);
		}
	}

	public drawGameScreen(): void {
		this._gameStats.paddleVelocity.left = this._gameStats.paddleDirection.left * PADDLE_SPEED;
		if (this._gameStats.paddlePositions.left + this._gameStats.paddleVelocity.left > 0
			&& this._gameStats.paddlePositions.left + this._gameStats.paddleVelocity.left < this._engine._canvas.width / 2 - PADDLE_HEIGHT) {
			this._gameStats.paddlePositions.left += this._gameStats.paddleVelocity.left;
		}
		this._gameStats.paddleVelocity.right = this._gameStats.paddleDirection.right * PADDLE_SPEED;
		if (this._gameStats.paddlePositions.right + this._gameStats.paddleVelocity.right > this._engine._canvas.width / 2
			&& this._gameStats.paddlePositions.right + this._gameStats.paddleVelocity.right < this._engine._canvas.width - PADDLE_HEIGHT) {
			this._gameStats.paddlePositions.right += this._gameStats.paddleVelocity.right;
		}

		this._gameStats.ball1Position.x += this._gameStats.ball1Velocity.x;
		this._gameStats.ball1Position.y += this._gameStats.ball1Velocity.y;

		this._gameStats.ball2Position.x += this._gameStats.ball2Velocity.x;
		this._gameStats.ball2Position.y += this._gameStats.ball2Velocity.y;

		this._renderEngine.renderFrame();

		this._collisionHandler.checkCollisions();

		this.checkWinCondition()

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
		if (msg.type == "CANCELMATCH" || msg.type == "ERROR") {
			this._engine.endGameLoop();
		}
		if (!msg.ballPosition) {
			return;
		}
		if (this._gameStats.pnumber == this._p1.getPnumber()) {
			this._gameStats.paddlePositions.right = msg.paddlePositions.right;
			this._gameStats.scores.right = msg.scores.right;
			this._gameStats.ball2Position = msg.ball2Position;
			this._gameStats.ball2Velocity = msg.ball2Velocity;
		}
		else if (this._gameStats.pnumber == this._p2.getPnumber()) {
			this._gameStats.paddlePositions.left = msg.paddlePositions.left;
			this._gameStats.scores.left = msg.score.left
			this._gameStats.ball1Position = msg.ball1Position;
			this._gameStats.ball1Velocity = msg.ball1Velocity;
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
		else if (this._oppMode != OpponentMode.ONLINE && this._oppMode != OpponentMode.MULTI) {
			const msg = {
				"type": 5,
				"roomId": this._engine._roomID,
				"status": "finished"
			}
			console.log('Sending finish match msg:', JSON.stringify(msg));
			this._engine._ws.sendMessage(JSON.stringify(msg));
		}
	}

	private checkWinCondition(): boolean {
		if (this._gameStats.scores.left <= 0) {
			this._running = false;
			console.log('winner: ', this._p1.getName(), " pos: ", this._p1.getPosition());
			this._engine._gameStateMachine.transition(GameState.GAME_OVER);
			this._winScreen.drawWinScreen(this._p1.getName());
			this.sendFinishMessage();
			return false;
		}
		
		if (this._gameStats.scores.right <= 0) {
			this._running = false;
			console.log('winner: ', this._p2.getName(), " pos: ", this._p2.getPosition());
			this._engine._gameStateMachine.transition(GameState.GAME_OVER);
			this._winScreen.drawWinScreen(this._p2.getName());
			this.sendFinishMessage();
			return false;
		}
		return false;
	}
}