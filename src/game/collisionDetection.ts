import { BALL_RADIUS, BALL_SPEED, PADDLE_DISTANCE_FROM_BORDER, PADDLE_HEIGHT, PADDLE_WIDTH } from '../constants.js';
import { PongGame } from './gameEngine.js';
import { getRandomAngle, getRandomDirection } from './utils.js';

export class CollisionHandler {
	private pongGame: PongGame

	constructor(game: PongGame) {
		this.pongGame = game;
	}

	public checkCollisions(): void {
		//wall collisions
		if (this.pongGame.gameState.ballPosition.y <= 0 + BALL_RADIUS || this.pongGame.gameState.ballPosition.y >= this.pongGame.canvas.height - BALL_RADIUS) {
				this.pongGame.gameState.ballVelocity.y *= -1;
		}

		//paddle collisions
		this.pongGame.paddleSides.forEach(side => {
			const paddleY = this.pongGame.gameState.paddlePositions[side];
			if (this.isBallHittingPaddle(side)) {
				this.pongGame.gameState.ballVelocity.x *= -1;
			}
		});

		//goal collision
		if (this.pongGame.gameState.ballPosition.x <= 0) {
			this.scorePoint('right');
		}
		
		if (this.pongGame.gameState.ballPosition.x >= this.pongGame.canvas.width) {
			this.scorePoint('left');
		}
	}

	private isBallHittingPaddle(side: 'left' | 'right'): boolean {
		const paddleY = this.pongGame.gameState.paddlePositions[side];
		const paddleHeight = PADDLE_HEIGHT;
		const ballRadius = BALL_RADIUS;

		const isWithinVerticalRange = this.pongGame.gameState.ballPosition.y >= paddleY - ballRadius && this.pongGame.gameState.ballPosition.y <= paddleY + paddleHeight + ballRadius;
		const isTouchingPaddle = side === 'left'
			? this.pongGame.gameState.ballPosition.x <= ballRadius + PADDLE_DISTANCE_FROM_BORDER + PADDLE_WIDTH - 2
			: this.pongGame.gameState.ballPosition.x >= this.pongGame.canvas.width - ballRadius - PADDLE_DISTANCE_FROM_BORDER - PADDLE_WIDTH + 2;
		
		return isWithinVerticalRange && isTouchingPaddle;
	}

		private scorePoint(side: 'left' | 'right'): void {
		this.pongGame.gameState.scores[side]++;
		this.pongGame.gameState.ballPosition = {
			x: this.pongGame.canvas.width / 2,
			y: this.pongGame.canvas.height / 2
		};

		const randomDirection = getRandomDirection()
		const randomAngle = getRandomAngle();
		const speed = BALL_SPEED;
		this.pongGame.gameState.ballVelocity = {
			x: randomDirection * Math.cos(randomAngle) * speed,
			y: Math.sin(randomAngle) * speed
		};
	}
}