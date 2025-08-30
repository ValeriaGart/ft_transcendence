import type { BreakoutGame } from './breakoutGame.ts';
import { BALL_RADIUS, BALL_SPEED, BLOCK_COLUMNS, BLOCK_HEIGHT, BLOCK_ROWS, BLOCK_WIDTH, PADDLE_DISTANCE_FROM_BORDER, PADDLE_HEIGHT, PADDLE_SPEED, PADDLE_WIDTH } from './constants.ts';

export class BreakoutCollisionHandler {
	private _breakoutGame: BreakoutGame

	constructor(breakoutGame: BreakoutGame) {
		this._breakoutGame = breakoutGame;
	}

	public checkCollisions(): void {
		//wall collisions
		if (this._breakoutGame._gameStats.ball1Position.y <= 0 + BALL_RADIUS && this._breakoutGame._gameStats.ball1Velocity.y < 0) {
			this._breakoutGame._gameStats.ball1Velocity.y *= -1;
		}
		if (this._breakoutGame._gameStats.ball1Position.x <= 0 + BALL_RADIUS && this._breakoutGame._gameStats.ball1Velocity.x < 0) {
			this._breakoutGame._gameStats.ball1Velocity.x *= -1;
		}
		if (this._breakoutGame._gameStats.ball1Position.x >= this._breakoutGame._engine._canvas.width / 2 - BALL_RADIUS && this._breakoutGame._gameStats.ball1Velocity.x > 0) {
			this._breakoutGame._gameStats.ball1Velocity.x *= -1;
		}

		if (this._breakoutGame._gameStats.ball2Position.y <= 0 + BALL_RADIUS && this._breakoutGame._gameStats.ball2Velocity.y < 0) {
			this._breakoutGame._gameStats.ball2Velocity.y *= -1;
		}
		if (this._breakoutGame._gameStats.ball2Position.x <= this._breakoutGame._engine._canvas.width / 2 + BALL_RADIUS && this._breakoutGame._gameStats.ball2Velocity.x < 0) {
			this._breakoutGame._gameStats.ball2Velocity.x *= -1;
		}
		if (this._breakoutGame._gameStats.ball2Position.x >= this._breakoutGame._engine._canvas.width - BALL_RADIUS && this._breakoutGame._gameStats.ball2Velocity.x > 0) {
			this._breakoutGame._gameStats.ball2Velocity.x *= -1;
		}


		//paddle collisions
		this._breakoutGame._paddleSides.forEach(side => {
			if (this.isBallHittingPaddle(side)) {
				if (side == 'left') {
					if (this._breakoutGame._gameStats.ball1Velocity.y > 0) {
						this._breakoutGame._gameStats.ball1Velocity.y *= -1;
					}
					if (this.isPaddleHittingWall('left') == false) {
						this._breakoutGame._gameStats.ball1Velocity.x += this._breakoutGame._gameStats.paddleVelocity.left / 4;
					} 
				}
				if (side == 'right') {
					if (this._breakoutGame._gameStats.ball2Velocity.y > 0) {
						this._breakoutGame._gameStats.ball2Velocity.y *= -1;
					}
					if (this.isPaddleHittingWall('right') == false) {
						this._breakoutGame._gameStats.ball2Velocity.x += this._breakoutGame._gameStats.paddleVelocity.right / 4;
					}
				}
			}
		});

		this.Blocks();
		this.Blocks2();

		//goal collision
		if (this._breakoutGame._gameStats.ball1Position.y >= this._breakoutGame._engine._canvas.height) {
			this.resetBall('left');
		}
		if (this._breakoutGame._gameStats.ball2Position.y >= this._breakoutGame._engine._canvas.height) {
			this.resetBall('right');
		}
	}

	private	isPaddleHittingWall(side: 'left' | 'right'): boolean {
		if (side == 'left' && (this._breakoutGame._gameStats.paddlePositions.left - PADDLE_SPEED < 0
			|| this._breakoutGame._gameStats.paddlePositions.left + PADDLE_HEIGHT + PADDLE_SPEED > this._breakoutGame._engine._canvas.width / 2)) {
				return true;
		}
		if (side == 'right' && (this._breakoutGame._gameStats.paddlePositions.right - PADDLE_SPEED < this._breakoutGame._engine._canvas.width / 2
			|| this._breakoutGame._gameStats.paddlePositions.right + PADDLE_HEIGHT + PADDLE_SPEED > this._breakoutGame._engine._canvas.width)) {
				return true;
		}
		return false;
	}

	private isBallHittingPaddle(side: 'left' | 'right'): boolean {
		const paddleX = this._breakoutGame._gameStats.paddlePositions[side];
		const paddleHeight = PADDLE_HEIGHT;
		const ballRadius = BALL_RADIUS;
		var isWithinHorizonzalRange = false;
		var isTouchingPaddle = false;

		if (side == 'left') {
			isWithinHorizonzalRange = this._breakoutGame._gameStats.ball1Position.x >= paddleX - ballRadius && this._breakoutGame._gameStats.ball1Position.x <= paddleX + paddleHeight + ballRadius;
			isTouchingPaddle = (this._breakoutGame._gameStats.ball1Position.y >= this._breakoutGame._engine._canvas.height - ballRadius - PADDLE_DISTANCE_FROM_BORDER - PADDLE_WIDTH + 2) && (this._breakoutGame._gameStats.ball1Position.y <= this._breakoutGame._engine._canvas.height - PADDLE_DISTANCE_FROM_BORDER);
		}
		if (side == 'right') {
			isWithinHorizonzalRange = this._breakoutGame._gameStats.ball2Position.x >= paddleX - ballRadius && this._breakoutGame._gameStats.ball2Position.x <= paddleX + paddleHeight + ballRadius;
			isTouchingPaddle = (this._breakoutGame._gameStats.ball2Position.y >= this._breakoutGame._engine._canvas.height - ballRadius - PADDLE_DISTANCE_FROM_BORDER - PADDLE_WIDTH + 2) && (this._breakoutGame._gameStats.ball2Position.y <= this._breakoutGame._engine._canvas.height - PADDLE_DISTANCE_FROM_BORDER);
		}

		return isWithinHorizonzalRange && isTouchingPaddle;
	}

	private resetBall(side: 'left' | 'right'): void {
		const speed = BALL_SPEED;
		if (side == 'left') {
			this._breakoutGame._gameStats.ball1Position = {
				x: this._breakoutGame._engine._canvas.width / 4,
				y: this._breakoutGame._engine._canvas.height / 2
			}
			this._breakoutGame._gameStats.ball1Velocity = { x: 0 * speed, y: 1 * speed};
		}
		if (side == 'right') {
			this._breakoutGame._gameStats.ball2Position = {
				x: (this._breakoutGame._engine._canvas.width / 4) * 3,
				y: this._breakoutGame._engine._canvas.height / 2
			}
			this._breakoutGame._gameStats.ball2Velocity = { x: 0 * speed, y: 1 * speed};
		}
	}

	private Blocks(): void {
		const start = (this._breakoutGame._engine._canvas.width / 4) - ((BLOCK_WIDTH * BLOCK_COLUMNS) / 2);
		for (var row = 0; row < BLOCK_ROWS; row++) {
			for (var col = 0; col < BLOCK_COLUMNS; col++) {
				if (this._breakoutGame._blocks[row][col] == true) {

					var blockLeft = start + ((5 + BLOCK_WIDTH) * (col));
					var blockRight = blockLeft + BLOCK_WIDTH;
					var blockTop = this._breakoutGame._engine._canvas.height / 3 + ((5 + BLOCK_HEIGHT) * (row));
					var blockBottom = blockTop + BLOCK_HEIGHT;

					if (this._breakoutGame._gameStats.ball1Position.x + BALL_RADIUS >= blockLeft &&
						this._breakoutGame._gameStats.ball1Position.x - BALL_RADIUS <= blockRight &&
						this._breakoutGame._gameStats.ball1Position.y + BALL_RADIUS >= blockTop &&
						this._breakoutGame._gameStats.ball1Position.y - BALL_RADIUS <= blockBottom) {

									this._breakoutGame._blocks[row][col] = false;
							
							const distanceToLeft = Math.abs(blockLeft - this._breakoutGame._gameStats.ball1Position.x);
							const distanceToRight = Math.abs(blockRight - this._breakoutGame._gameStats.ball1Position.x);
							const distanceToTop = Math.abs(blockTop - this._breakoutGame._gameStats.ball1Position.y);
							const distanceToBottom = Math.abs(blockBottom - this._breakoutGame._gameStats.ball1Position.y);
							
							let minDistance = Math.min(distanceToLeft, distanceToRight, distanceToTop, distanceToBottom);
							
							if (Math.abs(distanceToLeft - minDistance) < 0.1 || Math.abs(distanceToRight - minDistance) < 0.1) {
								this._breakoutGame._gameStats.ball1Velocity.x *= -1;
							}
							if (Math.abs(distanceToTop - minDistance) < 0.1 || Math.abs(distanceToBottom - minDistance) < 0.1) {
								this._breakoutGame._gameStats.ball1Velocity.y *= -1;
							}
						this._breakoutGame._gameStats.scores.left -= 1;
					}
				}
			}
		}
	}

	private Blocks2(): void {
		const start = ((this._breakoutGame._engine._canvas.width / 4) * 3) - ((BLOCK_WIDTH * BLOCK_COLUMNS) / 2);
		for (var row = 0; row < BLOCK_ROWS; row++) {
			for (var col = 0; col < BLOCK_COLUMNS; col++) {
				if (this._breakoutGame._blocks2[row][col] == true) {

					var blockLeft = start + ((5 + BLOCK_WIDTH) * (col));
					var blockRight = blockLeft + BLOCK_WIDTH;
					var blockTop = this._breakoutGame._engine._canvas.height / 3 + ((5 + BLOCK_HEIGHT) * (row));
					var blockBottom = blockTop + BLOCK_HEIGHT;

					if (this._breakoutGame._gameStats.ball2Position.x + BALL_RADIUS >= blockLeft &&
						this._breakoutGame._gameStats.ball2Position.x - BALL_RADIUS <= blockRight &&
						this._breakoutGame._gameStats.ball2Position.y + BALL_RADIUS >= blockTop &&
						this._breakoutGame._gameStats.ball2Position.y - BALL_RADIUS <= blockBottom) {

									this._breakoutGame._blocks2[row][col] = false;
							
							const distanceToLeft = Math.abs(blockLeft - this._breakoutGame._gameStats.ball2Position.x);
							const distanceToRight = Math.abs(blockRight - this._breakoutGame._gameStats.ball2Position.x);
							const distanceToTop = Math.abs(blockTop - this._breakoutGame._gameStats.ball2Position.y);
							const distanceToBottom = Math.abs(blockBottom - this._breakoutGame._gameStats.ball2Position.y);
							
							let minDistance = Math.min(distanceToLeft, distanceToRight, distanceToTop, distanceToBottom);
							
							if (Math.abs(distanceToLeft - minDistance) < 0.1 || Math.abs(distanceToRight - minDistance) < 0.1) {
								this._breakoutGame._gameStats.ball2Velocity.x *= -1;
							}
							if (Math.abs(distanceToTop - minDistance) < 0.1 || Math.abs(distanceToBottom - minDistance) < 0.1) {
								this._breakoutGame._gameStats.ball2Velocity.y *= -1;
							}
						this._breakoutGame._gameStats.scores.right -= 1;
					}
				}
			}
		}
	}
}