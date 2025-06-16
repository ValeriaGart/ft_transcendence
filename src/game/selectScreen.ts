import GameEngine from "./gameEngine.js";
import { GameMode } from "../types.js";

export class SelectScreen {
	private _engine: GameEngine

	public _options: GameMode[] = [GameMode.INFINITE, GameMode.BEST_OF, GameMode.TOURNAMENT];
	public _currentOption: GameMode = GameMode.INFINITE;
	public _selectedText: string = "";
	private _arrowHeight: number = 0;

	constructor(engine: GameEngine) {
		this._engine = engine;
	}
	
	public drawSelectScreen(): void {
		this._engine._ctx.fillStyle = 'black';
		this._engine._ctx.fillRect(0, 0, this._engine._canvas.width, this._engine._canvas.height);

		//title
		this._engine._ctx.fillStyle = 'white';
		this._engine._ctx.font = '100px Arial';
		this._engine._ctx.textAlign = "center";
		this._engine._ctx.textBaseline = "middle";
		this._engine._ctx.fillText('select game mode', this._engine._canvas.width / 2, 150);

		this._engine._ctx.fillStyle = 'white';
		this._engine._ctx.font = '75px Arial';
		this._engine._ctx.textAlign = "center";
		this._engine._ctx.textBaseline = "middle";
		
		//option 1
		this._engine._ctx.fillText(
			this._options[0],
			this._engine._canvas.width / 2,
			this._engine._canvas.height / 2 - 100
		);
		
		//option 2
		this._engine._ctx.fillText(
			this._options[1],
			this._engine._canvas.width / 2,
			this._engine._canvas.height / 2 + 100
		);
		
		//option 3
		this._engine._ctx.fillText(
			this._options[2],
			this._engine._canvas.width / 2,
			this._engine._canvas.height / 2 + 300
		);

		// selection

		switch (this._currentOption) {
			case GameMode.INFINITE:
				this._arrowHeight = this._engine._canvas.height / 2 - 100;
				break;
			case GameMode.BEST_OF:
				this._arrowHeight = this._engine._canvas.height / 2 + 100;
				break;
			case GameMode.TOURNAMENT:
				this._arrowHeight = this._engine._canvas.height / 2 + 300;
				break;
		}
		this._engine._ctx.fillText(
			'>',
			this._engine._canvas.width / 2 - 230,
			this._arrowHeight
		);
		this._engine._ctx.fillText(
			'<',
			this._engine._canvas.width / 2 + 230,
			this._arrowHeight
		);
	}
}