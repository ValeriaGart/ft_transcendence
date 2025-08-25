import { PADDLE_DISTANCE_FROM_BORDER, PADDLE_HEIGHT, PADDLE_WIDTH } from "./constants.ts";
import { PongGame } from "./pongGame.ts";

export class BotAI{
	private _side: string;
	private _lastDirection: string = "default";
	private readonly PREDICTION_TIME: number = 1000; // 1 second prediction window


	constructor(side: string) {
		this._side = side;
	}


	private generateKeyPress(keypress: string, eventType: string): void {
		const event = new KeyboardEvent(eventType, {
			key: keypress,
			cancelable: true,
			bubbles: true,
			location: 1
		});
		document.dispatchEvent(event);
	}


	private predictBallImpact(ballPosition: { x: number; y: number }, ballVelocity: { x: number; y: number }, pongGame: PongGame) : number {
		var currentPosition = {...ballPosition};
		var currentVelocity = {...ballVelocity};

		for (var i: number = 0; i < 60; i++) {
			currentPosition.x += currentVelocity.x;
			currentPosition.y += currentVelocity.y;
			if (currentPosition.y <= 0 || currentPosition.y >= pongGame._engine._canvas.height) {
				currentVelocity.y *= -1;
			}
			if (this._side == 'right') {
				if (currentPosition.x <= PADDLE_DISTANCE_FROM_BORDER + PADDLE_WIDTH) {
					currentVelocity.x *= -1;
				}
				if (currentVelocity.x >= pongGame._engine._canvas.width - PADDLE_DISTANCE_FROM_BORDER - PADDLE_WIDTH) {
					return currentPosition.y;
				}
			}
			if (this._side == 'left') {
				if (currentPosition.x <= pongGame._engine._canvas.width - PADDLE_DISTANCE_FROM_BORDER - PADDLE_WIDTH) {
					currentVelocity.x *= -1;
				}
				if (currentVelocity.x >= PADDLE_DISTANCE_FROM_BORDER + PADDLE_WIDTH) {
					return currentPosition.y;
				}
			}
		}
		return currentPosition.y;
	}

	private movePaddleToPosition(currentPos: number, targetPos: number ): number {
		if (targetPos > currentPos + (PADDLE_HEIGHT/2)) {
			this.generateKeyPress(this._side === 'left' ? 's' : 'ArrowDown', 'keydown');
			this._lastDirection = "down";
		}
		else if (targetPos < currentPos + PADDLE_HEIGHT/2) {
			this.generateKeyPress(this._side === 'left' ? 'w' : 'ArrowUp', 'keydown');
			this._lastDirection = "up";
		}
		return targetPos;
	}

	public update(pongGame: PongGame): number {
		const ballPosition = pongGame._gameStats.ballPosition;
		const ballVelocity = pongGame._gameStats.ballVelocity;
		const paddlePosition = this._side === 'left'
			? pongGame._gameStats.paddlePositions.left
			: pongGame._gameStats.paddlePositions.right;
			
		var impactPosition = this.predictBallImpact(ballPosition, ballVelocity, pongGame);
		if (impactPosition == paddlePosition + PADDLE_HEIGHT / 2) impactPosition = 0;

		return this.movePaddleToPosition(paddlePosition, impactPosition);
	}

	public move(target: number, pongGame: PongGame) {
		if (this._lastDirection === "UP") {
			if (pongGame._gameStats.paddlePositions.right + PADDLE_HEIGHT / 2 < target) {
				this.generateKeyPress(this._side === 'left' ? 'w' : 'ArrowUp', 'keyup');
			}
		}
		if (this._lastDirection === "down") {
			if (pongGame._gameStats.paddlePositions.right  + PADDLE_HEIGHT / 2 > target) {
				this.generateKeyPress(this._side === 'left' ? 's' : 'ArrowDown', 'keyup');
			}
		}
	}

	public setSide(side: string): void {
		this._side = side;
		console.log('ai side set to:', this._side);
	}
}