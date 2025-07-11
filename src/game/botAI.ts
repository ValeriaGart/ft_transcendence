import { PADDLE_HEIGHT } from "./constants.ts";
import { PongGame } from "./pongGame.ts";

export class BotAI{
	private _side: string;

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

	public update(pongGame: PongGame): void {
		const ballPosition = pongGame._gameStats.ballPosition;

		var paddlePosition: number  = 0;
		if (this._side == 'left') {
			paddlePosition = pongGame._gameStats.paddlePositions.left;
		}
		else if (this._side == 'right') {
			paddlePosition = pongGame._gameStats.paddlePositions.right;
		}
		else return;

		if ((this._side == 'left' && pongGame._gameStats.ballVelocity.x > 0)
			|| (this._side == 'right' && pongGame._gameStats.ballVelocity.x < 0)) {
				return;
		}

		if (ballPosition.y > paddlePosition + PADDLE_HEIGHT){// - PADDLE_HEIGHT / 3) {
			if (this._side == 'left') {
				this.generateKeyPress('s', 'keydown');
			}
			else if (this._side == 'right') {
				this.generateKeyPress('ArrowDown', 'keydown');
			}
		}
		else if (ballPosition.y < paddlePosition + (PADDLE_HEIGHT / 3) * 2) {
			if (this._side == 'left') {
				this.generateKeyPress('w', 'keydown');
			}
			else if (this._side == 'right') {
				this.generateKeyPress('ArrowUp', 'keydown');
			}
		}
		else {
			if (this._side == 'left') {
				this.generateKeyPress('s', 'keyup');
				// this.generateKeyPress('w', 'keyup');
			}
			else if (this._side == 'right') {
				this.generateKeyPress('ArrowDown', 'keyup');
				// this.generateKeyPress('ArrowUp', 'keyup');
			}
		}
	}

	public setSide(side: string): void {
		this._side = side;
		console.log('ai side set to:', this._side);
	}
}