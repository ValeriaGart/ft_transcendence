import GameEngine from "./gameEngine.js";
import { GameMode } from "../types.js";

export class SelectScreen {
	private engine: GameEngine

	public options: GameMode[] = [GameMode.INFINITE, GameMode.BEST_OF, GameMode.TOURNAMENT];
	public currentOption: GameMode = GameMode.INFINITE;
	public selectedText: string = "";
	private arrowHeight = 0;

	constructor(engine: GameEngine) {
		this.engine = engine;
	}
	
	public drawSelectScreen(): void {
		this.engine.ctx.fillStyle = 'black';
		this.engine.ctx.fillRect(0, 0, this.engine.canvas.width, this.engine.canvas.height);

		//title
		this.engine.ctx.fillStyle = 'white';
		this.engine.ctx.font = '100px Arial';
		this.engine.ctx.textAlign = "center";
		this.engine.ctx.textBaseline = "middle";
		this.engine.ctx.fillText('select game mode', this.engine.canvas.width / 2, 150);

		this.engine.ctx.fillStyle = 'white';
		this.engine.ctx.font = '75px Arial';
		this.engine.ctx.textAlign = "center";
		this.engine.ctx.textBaseline = "middle";
		
		//option 1
		this.engine.ctx.fillText(
			this.options[0],
			this.engine.canvas.width / 2,
			this.engine.canvas.height / 2 - 100
		);
		
		//option 2
		this.engine.ctx.fillText(
			this.options[1],
			this.engine.canvas.width / 2,
			this.engine.canvas.height / 2 + 100
		);
		
		//option 3
		this.engine.ctx.fillText(
			this.options[2],
			this.engine.canvas.width / 2,
			this.engine.canvas.height / 2 + 300
		);

		// selection

		switch (this.currentOption) {
			case GameMode.INFINITE:
				this.arrowHeight = this.engine.canvas.height / 2 - 100;
				break;
			case GameMode.BEST_OF:
				this.arrowHeight = this.engine.canvas.height / 2 + 100;
				break;
			case GameMode.TOURNAMENT:
				this.arrowHeight = this.engine.canvas.height / 2 + 300;
				break;
		}
		this.engine.ctx.fillText(
			'-->',
			this.engine.canvas.width / 2 - 300,
			this.arrowHeight
		);
	}
}