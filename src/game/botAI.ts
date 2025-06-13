import { PADDLE_HEIGHT, PADDLE_SPEED } from "../constants.js";
import { PongGame } from "./pongGame.js";

export class BotAI{
	constructor() {}

	public update(pongGame: PongGame): void {
		const ballPosition = pongGame.gameStats.ballPosition;
		const paddlePosition = pongGame.gameStats.paddlePositions.right;
		var newPos: number;

		if (ballPosition.x < pongGame.engine.canvas.width / 2) {
			return;
		}

		if (ballPosition.y > paddlePosition + PADDLE_HEIGHT / 2) {
			newPos = paddlePosition + (2);
		}
		else if (ballPosition.y < paddlePosition - PADDLE_HEIGHT / 2) {
			newPos = paddlePosition - (2)
		}
		else return;

		if (newPos < 0) {
			pongGame.gameStats.paddlePositions.right = 0;
		}
		else if (newPos > pongGame.engine.canvas.height - PADDLE_HEIGHT) {
			pongGame.gameStats.paddlePositions.right = pongGame.engine.canvas.height - PADDLE_HEIGHT;
		}
		else {
			pongGame.gameStats.paddlePositions.right = newPos;
		}
	}
}