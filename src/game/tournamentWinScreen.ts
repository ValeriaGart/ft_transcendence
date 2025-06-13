import GameEngine from "./gameEngine.js";

export class TournamentWinScreen {
	private _engine: GameEngine

	constructor(_engine: GameEngine) {
		this._engine = _engine;
	}
	
	public drawWinScreen(name1: string, name2: string, name3: string): void {
		this._engine.ctx.fillStyle = 'black';
		this._engine.ctx.fillRect(0, 0, this._engine.canvas.width, this._engine.canvas.height);
		
		this._engine.ctx.font = '100px Arial';
		this._engine.ctx.fillStyle = 'white';
		this._engine.ctx.textAlign = 'center';
		this._engine.ctx.textBaseline = 'middle';
		
		this._engine.ctx.fillText('WINNER', this._engine.canvas.width / 2, this._engine.canvas.height / 4);
		
		this._engine.ctx.font = '150px Arial';
		this._engine.ctx.fillText(name1, this._engine.canvas.width / 2, this._engine.canvas.height / 2);
		
		this._engine.ctx.font = '50px Arial';
		this._engine.ctx.fillText("2nd place", this._engine.canvas.width / 4, this._engine.canvas.height - 250);
		this._engine.ctx.fillText(name2, this._engine.canvas.width / 4, this._engine.canvas.height - 200);
	
		this._engine.ctx.fillText("3rd place", (this._engine.canvas.width / 4) * 3, this._engine.canvas.height - 250);
		this._engine.ctx.fillText(name3, (this._engine.canvas.width / 4) * 3, this._engine.canvas.height - 200);


		this._engine.ctx.font = '50px Arial';
		this._engine.ctx.textAlign = "center";
		this._engine.ctx.fillText('press ENTER to continue', this._engine.canvas.width / 2, this._engine.canvas.height - 100);
	}
}