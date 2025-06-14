import GameEngine from "./gameEngine.js";

export class TournamentWinScreen {
	private _engine: GameEngine

	constructor(engine: GameEngine) {
		this._engine = engine;
	}
	
	public drawWinScreen(name1: string, name2: string, name3: string): void {
		this._engine._ctx.fillStyle = 'black';
		this._engine._ctx.fillRect(0, 0, this._engine._canvas.width, this._engine._canvas.height);
		
		this._engine._ctx.font = '100px Arial';
		this._engine._ctx.fillStyle = 'white';
		this._engine._ctx.textAlign = 'center';
		this._engine._ctx.textBaseline = 'middle';
		
		this._engine._ctx.fillText('WINNER', this._engine._canvas.width / 2, this._engine._canvas.height / 4 - 100);
		
		this._engine._ctx.font = '150px Arial';
		this._engine._ctx.fillText(name1, this._engine._canvas.width / 2, this._engine._canvas.height / 2 - 100);
		
		this._engine._ctx.font = '50px Arial';
		this._engine._ctx.fillText("2nd place", this._engine._canvas.width / 4, this._engine._canvas.height - 250);
		this._engine._ctx.fillText(name2, this._engine._canvas.width / 4, this._engine._canvas.height - 200);
	
		this._engine._ctx.fillText("3rd place", (this._engine._canvas.width / 4) * 3, this._engine._canvas.height - 250);
		this._engine._ctx.fillText(name3, (this._engine._canvas.width / 4) * 3, this._engine._canvas.height - 200);


		this._engine._ctx.font = '50px Arial';
		this._engine._ctx.textAlign = "center";
		this._engine._ctx.fillText('press ENTER to continue', this._engine._canvas.width / 2, this._engine._canvas.height - 100);
	}
}