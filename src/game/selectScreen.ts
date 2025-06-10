import GameEngine from "./gameEngine.js";
import { GameState } from "../types.js";

export class SelectScreen {
	private engine: GameEngine

	public options: string[] = ["infinite", "best of 5"];
	public currentOption: number = 0;
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

		// selection

		switch (this.currentOption) {
			case 0:
				this.arrowHeight = this.engine.canvas.height / 2 - 100;
				break;
			case 1:
				this.arrowHeight = this.engine.canvas.height / 2 + 100;
				break;
		}
		this.engine.ctx.fillText(
			'-->',
			this.engine.canvas.width / 2 - 300,
			this.arrowHeight
		);
	}
}