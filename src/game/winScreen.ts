import type { BreakoutGame } from "./breakoutGame.ts";
import { colours } from "./constants.ts";
import { PongGame } from "./pongGame.ts";

export class WinScreen {
	private _pongGame: PongGame | BreakoutGame

	constructor(game: PongGame | BreakoutGame) {
		this._pongGame = game;
	}
	
	public drawWinScreen(name: string): void {
		this._pongGame._engine._ctx.fillStyle = colours.background;
		this._pongGame._engine._ctx.fillRect(0, 0, this._pongGame._engine._canvas.width, this._pongGame._engine._canvas.height);
		
		this._pongGame._engine._ctx.font = '100px Arial';
		this._pongGame._engine._ctx.fillStyle = colours.winner;
		this._pongGame._engine._ctx.textAlign = 'center';
		this._pongGame._engine._ctx.textBaseline = 'middle';
		
		this._pongGame._engine._ctx.fillText('WINNER', this._pongGame._engine._canvas.width / 2, this._pongGame._engine._canvas.height / 4);
		
		this._pongGame._engine._ctx.font = '150px Arial';
		this._pongGame._engine._ctx.fillText(name, this._pongGame._engine._canvas.width / 2, this._pongGame._engine._canvas.height / 2);
		this._pongGame._engine._ctx.fillStyle = colours.foregroundMain;
	
		this._pongGame._engine._ctx.font = '75px Arial';
		this._pongGame._engine._ctx.fillText('press ENTER to continue', this._pongGame._engine._canvas.width / 2, (this._pongGame._engine._canvas.height / 5) * 4);
	}

	public drawTeamsWinScreen(name: string, name2: string): void {
		this._pongGame._engine._ctx.fillStyle = colours.background;
		this._pongGame._engine._ctx.fillRect(0, 0, this._pongGame._engine._canvas.width, this._pongGame._engine._canvas.height);
		
		this._pongGame._engine._ctx.font = '100px Arial';
		this._pongGame._engine._ctx.fillStyle = colours.winner;
		this._pongGame._engine._ctx.textAlign = 'center';
		this._pongGame._engine._ctx.textBaseline = 'middle';
		
		this._pongGame._engine._ctx.fillText('WINNERS', this._pongGame._engine._canvas.width / 2, this._pongGame._engine._canvas.height / 4);
		
		this._pongGame._engine._ctx.font = '150px Arial';
		this._pongGame._engine._ctx.fillStyle = colours.paddle;
		this._pongGame._engine._ctx.fillText(name, this._pongGame._engine._canvas.width / 2, this._pongGame._engine._canvas.height / 2 - 50);
		this._pongGame._engine._ctx.fillText(name2, this._pongGame._engine._canvas.width / 2, this._pongGame._engine._canvas.height / 2 + 100);
		this._pongGame._engine._ctx.fillStyle = colours.foregroundMain;
	
		this._pongGame._engine._ctx.font = '75px Arial';
		this._pongGame._engine._ctx.fillText('press ENTER to continue', this._pongGame._engine._canvas.width / 2, (this._pongGame._engine._canvas.height / 5) * 4);
	}
}