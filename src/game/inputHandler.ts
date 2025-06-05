import { PADDLE_HEIGHT, PADDLE_SPEED } from '../constants.js';
import { PongGame } from './gameEngine.js';

export class InputHandler {
	private pongGame: PongGame

	constructor(game: PongGame) {
		this.pongGame = game;
	}

	public setupEventListeners(): void {
		window.addEventListener('keydown', this.handleKeyDown.bind(this));
		window.addEventListener('keyup', this.handleKeyUp.bind(this));
	}

	private handleKeyDown(event: KeyboardEvent): void {
		switch(event.key) {
			case 'w': this.movePaddle('left', -PADDLE_SPEED); break;
			case 's': this.movePaddle('left', PADDLE_SPEED); break;
			case 'ArrowUp': this.movePaddle('right', -PADDLE_SPEED); break;
			case 'ArrowDown': this.movePaddle('right', PADDLE_SPEED); break;
		}
	}

	private handleKeyUp(event: KeyboardEvent): void {
		switch(event.key) {
			case 'w': this.movePaddle('left', 0); break;
			case 's': this.movePaddle('left', 0); break;
			case 'ArrowUp': this.movePaddle('right', 0); break;
			case 'ArrowDown': this.movePaddle('right', 0); break;
		}
	}

	private movePaddle(side: 'left' | 'right', direction: number): void {
		const currentPosition = this.pongGame.gameState.paddlePositions[side];
		const newPosition = currentPosition + (direction * 10);

		if (newPosition < 0) {
			this.pongGame.gameState.paddlePositions[side] = 0;
		}
		else if(newPosition > this.pongGame.canvas.height - PADDLE_HEIGHT) {
			this.pongGame.gameState.paddlePositions[side] = this.pongGame.canvas.height - PADDLE_HEIGHT;
		}
		else {
			this.pongGame.gameState.paddlePositions[side] = newPosition;
		}
	}
}