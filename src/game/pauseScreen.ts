import { colours } from "./constants.ts";
import GameEngine from "./gameEngine.ts";

export class PauseScreen {
	private _engine: GameEngine

	constructor(engine: GameEngine) {
		this._engine = engine;
	}
	
	public drawPauseScreen(): void {
		this._engine._ctx.fillStyle = colours.pauseBG;
		this._engine._ctx.fillRect(300, 200, this._engine._canvas.width - 600, this._engine._canvas.height - 400);
		
		this._engine._ctx.font = '250px Arial';
		this._engine._ctx.fillStyle = colours.foregroundMain;
		this._engine._ctx.textAlign = 'center';
		this._engine._ctx.textBaseline = 'middle';
		
		this._engine._ctx.fillText('PAUSED', this._engine._canvas.width / 2, this._engine._canvas.height / 2 - 110);
		this._engine._ctx.font = '75px Arial';
		this._engine._ctx.fillText(
			'ESC to resume',
			this._engine._canvas.width / 2,
			this._engine._canvas.height / 2 + 75
		);
		this._engine._ctx.fillText(
			'ENTER to return to menu',
			this._engine._canvas.width / 2,
			this._engine._canvas.height / 2 + 200
		);
	}
}