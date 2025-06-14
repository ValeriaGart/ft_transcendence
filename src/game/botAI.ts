import { PADDLE_HEIGHT, PADDLE_SPEED } from "../constants.js";
import { PongGame } from "./pongGame.js";

export class BotAI{
	constructor() {}

	public update(pongGame: PongGame): void {
		const _ballPosition = pongGame._gameStats.ballPosition;
		const _paddlePosition = pongGame._gameStats.paddlePositions.right;
		var newPos: number;

		if (_ballPosition.x < pongGame._engine._canvas.width / 2) {
			return;
		}

		if (_ballPosition.y > _paddlePosition + PADDLE_HEIGHT / 2) {
			newPos = _paddlePosition + (2);
		}
		else if (_ballPosition.y < _paddlePosition - PADDLE_HEIGHT / 2) {
			newPos = _paddlePosition - (2)
		}
		else return;

		if (newPos < 0) {
			pongGame._gameStats.paddlePositions.right = 0;
		}
		else if (newPos > pongGame._engine._canvas.height - PADDLE_HEIGHT) {
			pongGame._gameStats.paddlePositions.right = pongGame._engine._canvas.height - PADDLE_HEIGHT;
		}
		else {
			pongGame._gameStats.paddlePositions.right = newPos;
		}
	}
}