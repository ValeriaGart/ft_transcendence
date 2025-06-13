import { GameMode, OpponentMode } from "../types";
import GameEngine from "./gameEngine";
import { Player } from "./player";

export class PreBattleScreen {
	private engine: GameEngine

	constructor(engine: GameEngine) {
		this.engine = engine;
	}
	
	public drawPreBattleScreen(name1: string, name2: string, message: string): void {
		this.engine.ctx.fillStyle = 'black';
		this.engine.ctx.fillRect(0, 0, this.engine.canvas.width, this.engine.canvas.height);
		
		this.engine.ctx.font = '125px Arial';
		this.engine.ctx.fillStyle = 'white';
		this.engine.ctx.textAlign = 'center';
		this.engine.ctx.textBaseline = 'middle';
		
		this.engine.ctx.fillText(message, this.engine.canvas.width / 2, 150);
		
		this.engine.ctx.font = '100px Arial';
		this.engine.ctx.textAlign = "right";
		this.engine.ctx.fillText(name1, this.engine.canvas.width / 2, this.engine.canvas.height / 2 -  100);
		
		this.engine.ctx.font = '30px Arial';
		this.engine.ctx.textAlign = "center";
		this.engine.ctx.fillText('VS.', this.engine.canvas.width / 2, this.engine.canvas.height / 2);
		
		this.engine.ctx.font = '100px Arial';
		this.engine.ctx.textAlign = "left";
		this.engine.ctx.fillText(name2, this.engine.canvas.width / 2, this.engine.canvas.height / 2 + 100);
		
		
		this.engine.ctx.font = '50px Arial';
		this.engine.ctx.textAlign = "center";
		this.engine.ctx.fillText('press ENTER to continue', this.engine.canvas.width / 2, this.engine.canvas.height - 100);
	}

	public drawBrackets(p1: Player, p2: Player, p3: Player, p4: Player) {
		var message1: string;
		var message2: string;
		var message3: string;
		var message4: string;

		this.engine.ctx.fillStyle = 'black';
		this.engine.ctx.fillRect(0, 0, this.engine.canvas.width, this.engine.canvas.height);

		this.engine.ctx.font = '150px Arial';
		this.engine.ctx.fillStyle = 'white';
		this.engine.ctx.textAlign = 'center';
		this.engine.ctx.textBaseline = 'middle';

		this.engine.ctx.fillText('Previous Results', this.engine.canvas.width / 2, 150);

		this.engine.ctx.font = '75px Arial';

		if (p1.getPosition() == 3) {
			message1 = p1.getName() + ": WINNER";
		}
		else {
			message1 = p1.getName() + ": LOOSER";
		}

		if (p2.getPosition() == 3) {
			message2 = p2.getName() + ": WINNER";
		}
		else {
			message2 = p2.getName() + ": LOOSER";
		}

		if (p3.getPosition() == 3) {
			message3 = p3.getName() + ": WINNER";
		}
		else {
			message3 = p3.getName() + ": LOOSER";
		}

		if (p4.getPosition() == 3) {
			message4 = p4.getName() + ": WINNER";
		}
		else {
			message4 = p4.getName() + ": LOOSER";
		}

		this.engine.ctx.fillText(message1, this.engine.canvas.width / 4, 350);
		this.engine.ctx.fillText(message2, (this.engine.canvas.width / 4) * 3, 450);
		this.engine.ctx.fillText(message3, this.engine.canvas.width / 4, this.engine.canvas.height -250);
		this.engine.ctx.fillText(message4, (this.engine.canvas.width / 4) * 3, this.engine.canvas.height -150);

		this.engine.ctx.font = '50px Arial';
		this.engine.ctx.textAlign = "center";
		this.engine.ctx.fillText('press ENTER to continue', this.engine.canvas.width / 2, this.engine.canvas.height - 100);
	}
}