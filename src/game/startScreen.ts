import { colours } from "./constants.ts";
import GameEngine from "./gameEngine.ts";

export class StartScreen {
	private _engine: GameEngine

	constructor(engine: GameEngine) {
		this._engine = engine;
	}
	
	public drawStartScreen(): void {
		this._engine._ctx.fillStyle = colours.background;
		this._engine._ctx.fillRect(0, 0, this._engine._canvas.width, this._engine._canvas.height);
		
		this._engine._ctx.font = '250px Arial';
		this._engine._ctx.fillStyle = colours.foregroundMain;
		this._engine._ctx.textAlign = 'center';
		this._engine._ctx.textBaseline = 'middle';
		
		this._engine._ctx.fillText('Pong Game', this._engine._canvas.width / 2, this._engine._canvas.height / 2);
		
		this._engine._ctx.font = '100px Arial';
		this._engine._ctx.fillText('press enter to start', this._engine._canvas.width / 2, this._engine._canvas.height * 0.75);
	}
}