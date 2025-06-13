import { PongGame } from "./pongGame.js";

export class WinScreen {
	private pongGame: PongGame

	constructor(game: PongGame) {
		this.pongGame = game;
	}
	
	public drawWinScreen(name: string): void {
		this.pongGame.engine.ctx.fillStyle = 'black';
		this.pongGame.engine.ctx.fillRect(0, 0, this.pongGame.engine.canvas.width, this.pongGame.engine.canvas.height);
		
		this.pongGame.engine.ctx.font = '100px Arial';
		this.pongGame.engine.ctx.fillStyle = 'white';
		this.pongGame.engine.ctx.textAlign = 'center';
		this.pongGame.engine.ctx.textBaseline = 'middle';
		
		this.pongGame.engine.ctx.fillText('WINNER', this.pongGame.engine.canvas.width / 2, this.pongGame.engine.canvas.height / 4);
		
		this.pongGame.engine.ctx.font = '150px Arial';
		this.pongGame.engine.ctx.fillText(name, this.pongGame.engine.canvas.width / 2, this.pongGame.engine.canvas.height / 2);
	
		this.pongGame.engine.ctx.font = '75px Arial';
		this.pongGame.engine.ctx.fillText('press ENTER to continue', this.pongGame.engine.canvas.width / 2, (this.pongGame.engine.canvas.height / 5) * 4);
	}
}