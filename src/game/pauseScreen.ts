import PongGame from "./gameEngine.js";
import { GameState } from "../types.js";

export class PauseScreen {
	private pongGame: PongGame

	constructor(game: PongGame) {
		this.pongGame = game;
	}
	
	public drawPauseScreen(): void {
		this.pongGame.ctx.fillStyle = 'blue';
		this.pongGame.ctx.fillRect(300, 200, this.pongGame.canvas.width - 600, this.pongGame.canvas.height - 400);
		
		this.pongGame.ctx.font = '250px Arial';
		this.pongGame.ctx.fillStyle = 'white';
		this.pongGame.ctx.textAlign = 'center';
		this.pongGame.ctx.textBaseline = 'middle';
		
		this.pongGame.ctx.fillText('PAUSED', this.pongGame.canvas.width / 2, this.pongGame.canvas.height / 2 - 110);
		this.pongGame.ctx.font = '75px Arial';
		this.pongGame.ctx.fillText(
			'ESC to resume',
			this.pongGame.canvas.width / 2,
			this.pongGame.canvas.height / 2 + 75
		);
		this.pongGame.ctx.fillText(
			'ENTER to return to menu',
			this.pongGame.canvas.width / 2,
			this.pongGame.canvas.height / 2 + 200
		);
	}
}