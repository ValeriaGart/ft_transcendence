import type { BreakoutGame } from './breakoutGame.ts';
import { BALL_RADIUS, BLOCK_COLUMNS, BLOCK_HEIGHT, BLOCK_ROWS, BLOCK_WIDTH, PADDLE_DISTANCE_FROM_BORDER, PADDLE_HEIGHT, PADDLE_WIDTH, colours } from './constants.ts';
import { GameMode } from './types.ts';

export class BreakoutRenderEngine {
	private _breakoutGame: BreakoutGame

	constructor(game: BreakoutGame) {
		this._breakoutGame = game;
	}

	public renderFrame(): void {
		this._breakoutGame._engine._ctx.clearRect(0, 0, this._breakoutGame._engine._canvas.width, this._breakoutGame._engine._canvas.height);
		this._breakoutGame._engine._ctx.fillStyle = colours.background;
		this._breakoutGame._engine._ctx.fillRect(0, 0, this._breakoutGame._engine._canvas.width, this._breakoutGame._engine._canvas.height);

		this.drawCenterLine();
		this.drawBall1();
		this.drawBall2();
		this.drawBlocks();
		this.drawBlocks2();
		this.drawPaddles();
		this.drawScore();
		this.drawNames();
	}

	private drawBall1(): void {
		const { x, y } = this._breakoutGame._gameStats.ball1Position;
		const ballRadius = BALL_RADIUS;

		this._breakoutGame._engine._ctx.beginPath();
		this._breakoutGame._engine._ctx.arc(x, y, ballRadius, 0, Math.PI * 2);
		this._breakoutGame._engine._ctx.fillStyle = colours.ball;
		this._breakoutGame._engine._ctx.fill();
		this._breakoutGame._engine._ctx.closePath();
	}

	private drawBall2(): void {
		const { x, y } = this._breakoutGame._gameStats.ball2Position;
		const ballRadius = BALL_RADIUS;

		this._breakoutGame._engine._ctx.beginPath();
		this._breakoutGame._engine._ctx.arc(x, y, ballRadius, 0, Math.PI * 2);
		this._breakoutGame._engine._ctx.fillStyle = colours.ball;
		this._breakoutGame._engine._ctx.fill();
		this._breakoutGame._engine._ctx.closePath();
	}

	private drawPaddles(): void {
		const paddleWidth = PADDLE_WIDTH;
		const paddleHeight = PADDLE_HEIGHT;

		this._breakoutGame._engine._ctx.fillStyle = colours.paddle;
		this._breakoutGame._engine._ctx.fillRect(
			this._breakoutGame._gameStats.paddlePositions.left,
			this._breakoutGame._engine._canvas.height - paddleWidth - PADDLE_DISTANCE_FROM_BORDER,
			paddleHeight,
			paddleWidth
		);
		this._breakoutGame._engine._ctx.fillRect(
			this._breakoutGame._gameStats.paddlePositions.right,
			this._breakoutGame._engine._canvas.height - paddleWidth - PADDLE_DISTANCE_FROM_BORDER,
			paddleHeight,
			paddleWidth
		);
	}

	private drawScore(): void {
		this._breakoutGame._engine._ctx.font = '75px Arial';
		this._breakoutGame._engine._ctx.fillStyle = colours.foregroundMain;
		
		this._breakoutGame._engine._ctx.fillText(
			this._breakoutGame._gameStats.scores.left.toString(),
			(this._breakoutGame._engine._canvas.width / 2)- 20 - 250,
			85
		);
		this._breakoutGame._engine._ctx.fillText(
			this._breakoutGame._gameStats.scores.right.toString(),
			(this._breakoutGame._engine._canvas.width / 2) - 20 + 250,
			85
		);
	}

	private drawNames(): void {
		this._breakoutGame._engine._ctx.font = '50px Arial';
		this._breakoutGame._engine._ctx.fillStyle = colours.foregroundMain;

		if (this._breakoutGame._mode == GameMode.TEAMS) {
			
			this._breakoutGame._engine._ctx.fillText(
				this._breakoutGame._p1.getName() + "s team",
				75,
				75
			);
			this._breakoutGame._engine._ctx.textAlign = 'right';
			this._breakoutGame._engine._ctx.fillText(
				this._breakoutGame._p2.getName() + "s team",
				this._breakoutGame._engine._canvas.width - 75,
				75
			);
			this._breakoutGame._engine._ctx.textAlign = 'left';
		}
		else {
			this._breakoutGame._engine._ctx.fillText(
				this._breakoutGame._p1.getName(),
				75,
				75
			);
			this._breakoutGame._engine._ctx.textAlign = 'right';
			this._breakoutGame._engine._ctx.fillText(
				this._breakoutGame._p2.getName(),
				this._breakoutGame._engine._canvas.width - 75,
				75
			);
			this._breakoutGame._engine._ctx.textAlign = 'left';
		}
	}

	private drawCenterLine(): void {
		this._breakoutGame._engine._ctx.strokeStyle = colours.foregroundMain;
		this._breakoutGame._engine._ctx.lineWidth = 4;

		this._breakoutGame._engine._ctx.beginPath();
		this._breakoutGame._engine._ctx.moveTo(this._breakoutGame._engine._canvas.width / 2, 0);
		this._breakoutGame._engine._ctx.lineTo(this._breakoutGame._engine._canvas.width / 2, this._breakoutGame._engine._canvas.height);
		this._breakoutGame._engine._ctx.stroke();

		// this._breakoutGame._engine._ctx.setLineDash([]);
		this._breakoutGame._engine._ctx.stroke();

		// this._breakoutGame._engine._ctx.setLineDash([]);
	}

	private drawBlocks(): void {
		const start = (this._breakoutGame._engine._canvas.width / 4) - ((BLOCK_WIDTH * BLOCK_COLUMNS) / 2);
		for (var row = 0; row < BLOCK_ROWS; row++) {
			for (var col = 0; col < BLOCK_COLUMNS; col++) {
				if (this._breakoutGame._blocks[row][col] == true) {
					this._breakoutGame._engine._ctx.fillStyle = colours.paddle;
					this._breakoutGame._engine._ctx.fillRect(
						start + ((5 + BLOCK_WIDTH) * (col)),
						this._breakoutGame._engine._canvas.height / 3 + ((5 + BLOCK_HEIGHT) * (row)),
						BLOCK_WIDTH,
						BLOCK_HEIGHT
					);
				}
			}
		}
	}

	private drawBlocks2(): void {
		const start = ((this._breakoutGame._engine._canvas.width / 4) * 3) - ((BLOCK_WIDTH * BLOCK_COLUMNS) / 2);
		for (var row = 0; row < BLOCK_ROWS; row++) {
			for (var col = 0; col < BLOCK_COLUMNS; col++) {
				if (this._breakoutGame._blocks2[row][col] == true) {
					this._breakoutGame._engine._ctx.fillStyle = colours.paddle;
					this._breakoutGame._engine._ctx.fillRect(
						start + ((5 + BLOCK_WIDTH) * (col)),
						this._breakoutGame._engine._canvas.height / 3 + ((5 + BLOCK_HEIGHT) * (row)),
						BLOCK_WIDTH,
						BLOCK_HEIGHT
					);
				}
			}
		}
	}
}