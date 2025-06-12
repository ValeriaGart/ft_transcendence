import { PADDLE_HEIGHT, PADDLE_SPEED } from "../constants.js";
import { Player } from "./player.js";
import { PongGame } from "./pongGame.js";

export class BotAI{
	constructor() {}

	public update(pongGame: PongGame): void {
		const ballPosition = pongGame.gameStats.ballPosition;
		const paddlePosition = pongGame.gameStats.paddlePositions.right;
		var newPos: number;

		// const targetY = ballPosition.y + (ballPosition.x - pongGame.engine.canvas.width / 2) * (pongGame.engine.canvas.height / pongGame.engine.canvas.width);
		// if (targetY > paddlePosition - PADDLE_HEIGHT / 2 && targetY < paddlePosition + PADDLE_HEIGHT / 2) {
		// 	pongGame.gameStats.paddlePositions.right = targetY;
		// }

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