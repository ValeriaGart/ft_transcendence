import { BALL_RADIUS, BALL_SPEED, PADDLE_DISTANCE_FROM_BORDER, PADDLE_HEIGHT, PADDLE_WIDTH } from '../constants.js';
import { PongGame } from './pongGame.js';
import { getRandomAngle, getRandomDirection } from './utils.js';

export class CollisionHandler {
	private pongGame: PongGame

	constructor(pongGame: PongGame) {
		this.pongGame = pongGame;
	}

	public checkCollisions(): void {
		//wall collisions
		if (this.pongGame.gameStats.ballPosition.y <= 0 + BALL_RADIUS || this.pongGame.gameStats.ballPosition.y >= this.pongGame.engine.canvas.height - BALL_RADIUS) {
				this.pongGame.gameStats.ballVelocity.y *= -1;
		}

		//paddle collisions
		this.pongGame.paddleSides.forEach(side => {
			const paddleY = this.pongGame.gameStats.paddlePositions[side];
			if (this.isBallHittingPaddle(side)) {
				this.pongGame.gameStats.ballVelocity.x *= -1;
			}
		});

		//goal collision
		if (this.pongGame.gameStats.ballPosition.x <= 0) {
			this.scorePoint('right');
		}
		
		if (this.pongGame.gameStats.ballPosition.x >= this.pongGame.engine.canvas.width) {
			this.scorePoint('left');
		}
	}

	private isBallHittingPaddle(side: 'left' | 'right'): boolean {
		const paddleY = this.pongGame.gameStats.paddlePositions[side];
		const paddleHeight = PADDLE_HEIGHT;
		const ballRadius = BALL_RADIUS;

		const isWithinVerticalRange = this.pongGame.gameStats.ballPosition.y >= paddleY - ballRadius && this.pongGame.gameStats.ballPosition.y <= paddleY + paddleHeight + ballRadius;
		const isTouchingPaddle = side === 'left'
			? this.pongGame.gameStats.ballPosition.x <= ballRadius + PADDLE_DISTANCE_FROM_BORDER + PADDLE_WIDTH - 2
			: this.pongGame.gameStats.ballPosition.x >= this.pongGame.engine.canvas.width - ballRadius - PADDLE_DISTANCE_FROM_BORDER - PADDLE_WIDTH + 2;
		
		return isWithinVerticalRange && isTouchingPaddle;
	}

	private scorePoint(side: 'left' | 'right'): void {
		this.pongGame.gameStats.scores[side]++;
		this.pongGame.gameStats.ballPosition = {
			x: this.pongGame.engine.canvas.width / 2,
			y: this.pongGame.engine.canvas.height / 2
		};

		const randomDirection = getRandomDirection()
		const randomAngle = getRandomAngle();
		const speed = BALL_SPEED;
		this.pongGame.gameStats.ballVelocity = {
			x: randomDirection * Math.cos(randomAngle) * speed,
			y: Math.sin(randomAngle) * speed
		};
	}
}