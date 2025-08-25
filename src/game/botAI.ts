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


    private predictBallImpact(ballPos: { x: number; y: number }, ballVel: { x: number; y: number }, pongGame: PongGame): { x: number; y: number } {
        let currentPosition = { ...ballPos };
        let currentVelocity = { ...ballVel };
        let timeElapsed = 0;
        const deltaTime = 1/60; // Assuming 60 FPS

        while (timeElapsed < this.PREDICTION_TIME) {
            // Update ball position
            currentPosition.x += currentVelocity.x * deltaTime;
            currentPosition.y += currentVelocity.y * deltaTime;
            timeElapsed += deltaTime;

            // Handle wall collisions
            if (currentPosition.y <= 0 || currentPosition.y >= pongGame._engine._canvas.height) {
                currentVelocity.y *= -1;
                // Adjust velocity slightly to simulate realistic bounces
                currentVelocity.x *= 0.95;
            }

            // Check if ball would hit our paddle (treating other paddle as wall)
            if ((this._side === 'left' && currentPosition.x <= PADDLE_WIDTH) ||
                (this._side === 'right' && currentPosition.x >= pongGame._engine._canvas.width - PADDLE_WIDTH)) {
                // Ball hits paddle, assume perfect hit
                currentVelocity.x *= -1;
            }
        }

        return currentPosition;
    }

	private calculateTimeUntilImpact(
        ballPos: { x: number; y: number },
        ballVel: { x: number; y: number },
        impactPoint: { x: number; y: number }
    ): number {
        const distance = Math.abs(ballPos.y - impactPoint.y);
        const time = distance / Math.abs(ballVel.y);
        
        // Add reaction time buffer
        return time * 1000; // Convert to milliseconds
    }

	private movePaddleToPosition(currentPos: number, targetPos: { x: number; y: number }): number {
		console.log(currentPos + PADDLE_HEIGHT / 2, " ", targetPos.y);

		if (targetPos.y < currentPos + (PADDLE_HEIGHT/2)) {
			console.log("agag");
            this.generateKeyPress(this._side === 'left' ? 's' : 'ArrowDown', 'keydown');
			this._lastDirection = "down";
        }
		else if (targetPos.y < currentPos + PADDLE_HEIGHT/2) {
            this.generateKeyPress(this._side === 'left' ? 'w' : 'ArrowUp', 'keydown');
			this._lastDirection = "up";
        }
		return targetPos.y;
    }

    private movePaddleToCenter(currentPos: number, pongGame: PongGame): number {
        const centerPos = pongGame._engine._canvas.height / 2;
        if (currentPos + PADDLE_HEIGHT / 2 < centerPos) {
            this.generateKeyPress(this._side === 'left' ? 's' : 'ArrowDown', 'keydown');
			this._lastDirection = "down";
        }
		else if (currentPos + PADDLE_HEIGHT / 2 > centerPos) {
            this.generateKeyPress(this._side === 'left' ? 'w' : 'ArrowUp', 'keydown');
			this._lastDirection = "up";
        }
		return centerPos;
    }

	public update(pongGame: PongGame): number {
		const ballPosition = pongGame._gameStats.ballPosition;
		const ballVelocity = pongGame._gameStats.ballVelocity;
		const paddlePosition = this._side === 'left'
			? pongGame._gameStats.paddlePositions.left
			: pongGame._gameStats.paddlePositions.right;
			
		// Calculate predicted impact point
		const impactPoint = this.predictBallImpact(ballPosition, ballVelocity, pongGame);
        
        // Check if we have enough time to react
        const timeUntilImpact = this.calculateTimeUntilImpact(
			ballPosition,
            ballVelocity,
            impactPoint
        );
		
        if (timeUntilImpact > this.PREDICTION_TIME) {
			// Plenty of time, move to center position
            return this.movePaddleToCenter(paddlePosition, pongGame);
        } else {
			// Move to predicted impact point
			console.log(paddlePosition + PADDLE_HEIGHT / 2, " ", impactPoint);
            return this.movePaddleToPosition(paddlePosition, impactPoint);
        }

		// var paddlePosition: number  = 0;
		// if (this._side == 'left') {
		// 	paddlePosition = pongGame._gameStats.paddlePositions.left;
		// }
		// else if (this._side == 'right') {
		// 	paddlePosition = pongGame._gameStats.paddlePositions.right;
		// }
		// else return;

		// if ((this._side == 'left' && pongGame._gameStats.ballVelocity.x > 0)
		// 	|| (this._side == 'right' && pongGame._gameStats.ballVelocity.x < 0)) {
		// 		return;
		// }

		// if (ballPosition.y > paddlePosition + PADDLE_HEIGHT){// - PADDLE_HEIGHT / 3) {
		// 	if (this._side == 'left') {
		// 		this.generateKeyPress('s', 'keydown');
		// 	}
		// 	else if (this._side == 'right') {
		// 		this.generateKeyPress('ArrowDown', 'keydown');
		// 	}
		// }
		// else if (ballPosition.y < paddlePosition + (PADDLE_HEIGHT / 3) * 2) {
		// 	if (this._side == 'left') {
		// 		this.generateKeyPress('w', 'keydown');
		// 	}
		// 	else if (this._side == 'right') {
		// 		this.generateKeyPress('ArrowUp', 'keydown');
		// 	}
		// }
		// else {
		// 	if (this._side == 'left') {
		// 		this.generateKeyPress('s', 'keyup');
		// 	}
		// 	else if (this._side == 'right') {
		// 		this.generateKeyPress('ArrowDown', 'keyup');
		// 	}
		// }
	}

	public move(target: number, pongGame: PongGame) {
		if (this._lastDirection === "UP") {
			if (pongGame._gameStats.paddlePositions.right < target) {
				this.generateKeyPress(this._side === 'left' ? 'w' : 'ArrowUp', 'keyup');
			}
		}
		if (this._lastDirection === "down") {
			if (pongGame._gameStats.paddlePositions.right > target) {
				this.generateKeyPress(this._side === 'left' ? 's' : 'ArrowDown', 'keyup');
			}
		}
	}

	public setSide(side: string): void {
		this._side = side;
		console.log('ai side set to:', this._side);
	}
}