import { BALL_RADIUS, BALL_SPEED, PADDLE_DISTANCE_FROM_BORDER, PADDLE_HEIGHT, PADDLE_WIDTH } from '../constants.js';
import { PongGame } from './pongGame.js';
import { getRandomAngle, getRandomDirection } from './utils.js';

export class CollisionHandler {
	private _pongGame: PongGame

	constructor(pongGame: PongGame) {
		this._pongGame = pongGame;
	}

	public checkCollisions(): void {
		//wall collisions
		if (this._pongGame._gameStats.ballPosition.y <= 0 + BALL_RADIUS || this._pongGame._gameStats.ballPosition.y >= this._pongGame._engine._canvas.height - BALL_RADIUS) {
				this._pongGame._gameStats.ballVelocity.y *= -1;
		}

		//paddle collisions
		this._pongGame._paddleSides.forEach(side => {
			if (this.isBallHittingPaddle(side)) {
				this._pongGame._gameStats.ballVelocity.x *= -1;
				if (side == 'left') {
					this._pongGame._gameStats.ballVelocity.y += this._pongGame._gameStats.paddleVelocity.left / 4;
				}
				if (side == 'right') {
					this._pongGame._gameStats.ballVelocity.y += this._pongGame._gameStats.paddleVelocity.right / 4;
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