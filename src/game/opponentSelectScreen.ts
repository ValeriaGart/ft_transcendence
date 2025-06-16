import GameEngine from "./gameEngine.js";
import { OpponentMode } from "../types.js";

export class OpponentScreen {
	private _engine: GameEngine

	public _options: OpponentMode[] = [OpponentMode.SINGLE, OpponentMode.MULTI, OpponentMode.ONLINE];
	public _currentOption: OpponentMode = OpponentMode.SINGLE;
	private _arrowHeight: number = 0;

	constructor(engine: GameEngine) {
		this._engine = engine;
	}
	
	public drawOpponentScreen(): void {
		this._engine._ctx.fillStyle = 'black';
		this._engine._ctx.fillRect(0, 0, this._engine._canvas.width, this._engine._canvas.height);

		//title
		this._engine._ctx.fillStyle = 'white';
		this._engine._ctx.font = '100px Arial';
		this._engine._ctx.textAlign = "center";
		this._engine._ctx.textBaseline = "middle";
		this._engine._ctx.fillText('select opponent mode', this._engine._canvas.width / 2, 150);

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
			case OpponentMode.SINGLE:
				this._arrowHeight = this._engine._canvas.height / 2 - 100;
				break;
			case OpponentMode.MULTI:
				this._arrowHeight = this._engine._canvas.height / 2 + 100;
				break;
			case OpponentMode.ONLINE:
				this._arrowHeight = this._engine._canvas.height / 2 + 300;
				break;
		}
		this._engine._ctx.fillText(
			'>',
			this._engine._canvas.width / 2 - 330,
			this._arrowHeight
		);
		this._engine._ctx.fillText(
			'<',
			this._engine._canvas.width / 2 + 330,
			this._arrowHeight
		);
	}
}