import { PADDLE_HEIGHT } from "./constants.ts";
import { PongGame } from "./pongGame.ts";

export class BotAI{
	private _side: string;

	constructor(side: string) {
		this._side = side;
	}

	private generateKeyPress(evenType: string): void {
		const event = new KeyboardEvent('keydown', { key: evenType, cancelable: true, bubbles: true });

		document.dispatchEvent(event);
	}

	public update(pongGame: PongGame): void {
		const ballPosition = pongGame._gameStats.ballPosition;

		var paddlePosition: number  = 0;
		if (this._side == 'left') {
			paddlePosition = pongGame._gameStats.paddlePositions.left;
		}
		else {
			paddlePosition = pongGame._gameStats.paddlePositions.right;
		}

		if ((this._side == 'left' && pongGame._gameStats.ballVelocity.x > 0)
			|| (this._side == 'right' && pongGame._gameStats.ballVelocity.x < 0)) {
				return;
		}

		if (ballPosition.y > paddlePosition + PADDLE_HEIGHT){// - PADDLE_HEIGHT / 3) {
			if (this._side == 'left') {
				this.generateKeyPress('s');
			}
			else {
				this.generateKeyPress('ArrowDown');
			}
		}
		else if (ballPosition.y < paddlePosition){// + PADDLE_HEIGHT / 3) {
			if (this._side == 'left') {
				this.generateKeyPress('w');
			}
			else {
				this.generateKeyPress('ArrowUp');
			}
		}
		else return;
	}

	public setSide(side: string): void {
		this._side = side;
		console.log('ai side set to:', this._side);
	}
}