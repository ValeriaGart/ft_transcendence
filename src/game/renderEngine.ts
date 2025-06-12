import { BALL_RADIUS, PADDLE_DISTANCE_FROM_BORDER, PADDLE_HEIGHT, PADDLE_WIDTH } from '../constants.js';
import { PongGame } from './pongGame.js';

export class RenderEngine {
	private pongGame: PongGame

	constructor(game: PongGame) {
		this.pongGame = game;
	}

	public renderFrame(): void {
		this.pongGame.engine.ctx.clearRect(0, 0, this.pongGame.engine.canvas.width, this.pongGame.engine.canvas.height);

		this.drawBall();
		this.drawPaddles();
		this.drawScore();
		this.drawNames();
		this.drawCenterLine();
	}

	private drawBall(): void {
		const { x, y } = this.pongGame.gameStats.ballPosition;
		const ballRadius = BALL_RADIUS;

		this.pongGame.engine.ctx.beginPath();
		this.pongGame.engine.ctx.arc(x, y, ballRadius, 0, Math.PI * 2);
		this.pongGame.engine.ctx.fillStyle = 'white';
		this.pongGame.engine.ctx.fill();
		this.pongGame.engine.ctx.closePath();
	}

	private drawPaddles(): void {
		const paddleWidth = PADDLE_WIDTH;
		const paddleHeight = PADDLE_HEIGHT;

		this.pongGame.engine.ctx.fillStyle = 'white';
		this.pongGame.engine.ctx.fillRect(
			PADDLE_DISTANCE_FROM_BORDER,
			this.pongGame.gameStats.paddlePositions.left,
			paddleWidth,
			paddleHeight
		);
		this.pongGame.engine.ctx.fillRect(
			this.pongGame.engine.canvas.width - paddleWidth - PADDLE_DISTANCE_FROM_BORDER,
			this.pongGame.gameStats.paddlePositions.right,
			paddleWidth,
			paddleHeight
		);
	}

	private drawScore(): void {
		this.pongGame.engine.ctx.font = '75px Arial';
		this.pongGame.engine.ctx.fillStyle = 'white';
		
		this.pongGame.engine.ctx.fillText(
			this.pongGame.gameStats.scores.left.toString(),
			(this.pongGame.engine.canvas.width / 8) * 3,
			75
		);
		this.pongGame.engine.ctx.fillText(
			this.pongGame.gameStats.scores.right.toString(),
			(this.pongGame.engine.canvas.width / 8) * 5,
			75
		);
	}

	private drawNames(): void {
		this.pongGame.engine.ctx.font = '50px Arial';
		this.pongGame.engine.ctx.fillStyle = 'white';
		
		this.pongGame.engine.ctx.fillText(
			this.pongGame._p1.getName(),
			this.pongGame.engine.canvas.width / 8,
			75
		);
		this.pongGame.engine.ctx.fillText(
			this.pongGame._p2.getName(),
			(this.pongGame.engine.canvas.width / 8) * 7,
			75
		);
	}

	private drawCenterLine(): void {
		this.pongGame.engine.ctx.strokeStyle = '#565656';
		this.pongGame.engine.ctx.lineWidth = 4;

		this.pongGame.engine.ctx.beginPath();
		this.pongGame.engine.ctx.moveTo(this.pongGame.engine.canvas.width / 2, 0);
		this.pongGame.engine.ctx.lineTo(this.pongGame.engine.canvas.width / 2, this.pongGame.engine.canvas.height);
		this.pongGame.engine.ctx.stroke();

		this.pongGame.engine.ctx.setLineDash([10, 10]);
		this.pongGame.engine.ctx.stroke();

		// this.pongGame.engine.ctx.setLineDash([]);
	}
}