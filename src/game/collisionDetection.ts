import { BALL_RADIUS, BALL_SPEED, PADDLE_DISTANCE_FROM_BORDER, PADDLE_HEIGHT, PADDLE_SPEED, PADDLE_WIDTH } from './constants.ts';
import { PongGame } from './pongGame.ts';
import { getRandomAngle, getRandomDirection } from './utils.ts';

export class CollisionHandler {
	private _pongGame: PongGame

	constructor(pongGame: PongGame) {
		this._pongGame = pongGame;
	}

	public checkCollisions(): void {
		//wall collisions
		if (this._pongGame._gameStats.ballPosition.y <= 0 + BALL_RADIUS && this._pongGame._gameStats.ballVelocity.y < 0) {
			this._pongGame._gameStats.ballVelocity.y *= -1;
		}
		if (this._pongGame._gameStats.ballPosition.y >= this._pongGame._engine._canvas.height - BALL_RADIUS && this._pongGame._gameStats.ballVelocity.y > 0) {
			this._pongGame._gameStats.ballVelocity.y *= -1;
		}

		//paddle collisions
		this._pongGame._paddleSides.forEach(side => {
			if (this.isBallHittingPaddle(side)) {
				if (side == 'left') {
					if (this._pongGame._gameStats.ballVelocity.x < 0) {
						this._pongGame._gameStats.ballVelocity.x *= -1;
					}
					if (this.isPaddleHittingWall('left') == false) {
						this._pongGame._gameStats.ballVelocity.y += this._pongGame._gameStats.paddleVelocity.left / 4;
					} 
				}
				if (side == 'right') {
					if (this._pongGame._gameStats.ballVelocity.x > 0) {
						this._pongGame._gameStats.ballVelocity.x *= -1;
					}
					if (this.isPaddleHittingWall('right') == false) {
						this._pongGame._gameStats.ballVelocity.y += this._pongGame._gameStats.paddleVelocity.right / 4;
					}
				}
			}
		});

		//goal collision
		if (this._pongGame._gameStats.ballPosition.x <= 0) {
			this.scorePoint('right');
		}
		if (this._pongGame._gameStats.ballPosition.x >= this._pongGame._engine._canvas.width) {
			this.scorePoint('left');
		}
	}

	private	isPaddleHittingWall(side: 'left' | 'right'): boolean {
		if (side == 'left' && (this._pongGame._gameStats.paddlePositions.left - PADDLE_SPEED < 0
			|| this._pongGame._gameStats.paddlePositions.left - PADDLE_SPEED > this._pongGame._engine._canvas.height)) {
				return true;
		}
		if (side == 'right' && (this._pongGame._gameStats.paddlePositions.right - PADDLE_SPEED < 0
			|| this._pongGame._gameStats.paddlePositions.right - PADDLE_SPEED > this._pongGame._engine._canvas.height)) {
				return true;
		}
		return false;
	}

	private isBallHittingPaddle(side: 'left' | 'right'): boolean {
		const paddleY = this._pongGame._gameStats.paddlePositions[side];
		const paddleHeight = PADDLE_HEIGHT;
		const ballRadius = BALL_RADIUS;

		const isWithinVerticalRange = this._pongGame._gameStats.ballPosition.y >= paddleY - ballRadius && this._pongGame._gameStats.ballPosition.y <= paddleY + paddleHeight + ballRadius;
		const isTouchingPaddle = side === 'left'
			? (this._pongGame._gameStats.ballPosition.x <= ballRadius + PADDLE_DISTANCE_FROM_BORDER + PADDLE_WIDTH - 2) && (this._pongGame._gameStats.ballPosition.x >= PADDLE_DISTANCE_FROM_BORDER)
			: (this._pongGame._gameStats.ballPosition.x >= this._pongGame._engine._canvas.width - ballRadius - PADDLE_DISTANCE_FROM_BORDER - PADDLE_WIDTH + 2) && (this._pongGame._gameStats.ballPosition.x <= this._pongGame._engine._canvas.width - PADDLE_DISTANCE_FROM_BORDER);
		
		return isWithinVerticalRange && isTouchingPaddle;
	}

	private scorePoint(side: 'left' | 'right'): void {
		this._pongGame._gameStats.scores[side]++;
		this._pongGame._gameStats.ballPosition = {
			x: this._pongGame._engine._canvas.width / 2,
			y: this._pongGame._engine._canvas.height / 2
		};

		const randomDirection = getRandomDirection()
		const randomAngle = getRandomAngle();
		const speed = BALL_SPEED;
		this._pongGame._gameStats.ballVelocity = {
			x: randomDirection * Math.cos(randomAngle) * speed,
			y: Math.sin(randomAngle) * speed
		};
	}
}