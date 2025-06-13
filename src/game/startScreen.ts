import PongGame from "./gameEngine.js";

export class StartScreen {
	private pongGame: PongGame

	constructor(game: PongGame) {
		this.pongGame = game;
	}
	
	public drawStartScreen(): void {
		this.pongGame.ctx.fillStyle = 'black';
		this.pongGame.ctx.fillRect(0, 0, this.pongGame.canvas.width, this.pongGame.canvas.height);
		
		this.pongGame.ctx.font = '250px Arial';
		this.pongGame.ctx.fillStyle = 'white';
		this.pongGame.ctx.textAlign = 'center';
		this.pongGame.ctx.textBaseline = 'middle';
		
		this.pongGame.ctx.fillText('Pong Game', this.pongGame.canvas.width / 2, this.pongGame.canvas.height / 2);
		
		this.pongGame.ctx.font = '100px Arial';
		this.pongGame.ctx.fillText('press enter to start', this.pongGame.canvas.width / 2, this.pongGame.canvas.height * 0.75);
	}
}