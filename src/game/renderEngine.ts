import { BALL_RADIUS, PADDLE_DISTANCE_FROM_BORDER, PADDLE_HEIGHT, PADDLE_WIDTH } from '../constants.js';
import { PongGame } from './gameEngine.js';

export class RenderEngine {
	private pongGame: PongGame

	constructor(game: PongGame) {
		this.pongGame = game;
	}

	public renderFrame(): void {
		this.pongGame.ctx.clearRect(0, 0, this.pongGame.canvas.width, this.pongGame.canvas.height);

		this.drawBall();
		this.drawPaddles();
		this.drawScore();
	}

	private drawBall(): void {
		const { x, y } = this.pongGame.gameState.ballPosition;
		const ballRadius = BALL_RADIUS;

		this.pongGame.ctx.beginPath();
		this.pongGame.ctx.arc(x, y, ballRadius, 0, Math.PI * 2);
		this.pongGame.ctx.fillStyle = 'white';
		this.pongGame.ctx.fill();
		this.pongGame.ctx.closePath();
	}

	private drawPaddles(): void {
		const paddleWidth = PADDLE_WIDTH;
		const paddleHeight = PADDLE_HEIGHT;

		this.pongGame.ctx.fillStyle = 'white';
		this.pongGame.ctx.fillRect(
			PADDLE_DISTANCE_FROM_BORDER,
			this.pongGame.gameState.paddlePositions.left,
			paddleWidth,
			paddleHeight
		);
		this.pongGame.ctx.fillRect(
			this.pongGame.canvas.width - paddleWidth - PADDLE_DISTANCE_FROM_BORDER,
			this.pongGame.gameState.paddlePositions.right,
			paddleWidth,
			paddleHeight
		);
	}

	private drawScore(): void {
		this.pongGame.ctx.font = '75px Arial';
		this.pongGame.ctx.fillStyle = 'white';
		
		this.pongGame.ctx.fillText(
			this.pongGame.gameState.scores.left.toString(),
			this.pongGame.canvas.width / 3,
			75
		);
		this.pongGame.ctx.fillText(
			this.pongGame.gameState.scores.right.toString(),
			(this.pongGame.canvas.width / 3) * 2,
			75
		);
	}
}