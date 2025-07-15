import GameEngine from "./gameEngine.ts";
import { GameMode, GameState, OpponentMode } from "./types.ts";
import { Player } from "./player.ts";
import { PongGame } from "./pongGame.ts";
import { PreBattleScreen } from "./preBattleScreen.ts";
import { TournamentWinScreen } from "./tournamentWinScreen.ts";

export class Tournament {
	private _engine: GameEngine
	private _PreBattleScreen: PreBattleScreen;
	private _winScreen: TournamentWinScreen;

	private _players: Player[];
	private _p1: number;
	private _p2: number;
	private _p3: number;
	private _p4: number;

	private _mode: GameMode;
	private _oppMode: OpponentMode;

	constructor(engine: GameEngine, p1: Player, p2: Player, p3: Player, p4: Player, mode: GameMode,oppMode: OpponentMode) {
		this._engine = engine;
		this._PreBattleScreen = new PreBattleScreen(this._engine);
		this._winScreen = new TournamentWinScreen(this._engine);
		this._mode = mode;
		this._oppMode = oppMode;


		this._players = [p1, p2, p3, p4];

		if (oppMode == OpponentMode.SINGLE) {
			this._p1 = 0;
		}
		else {
			this._p1 = Math.floor(Math.random() * 3);
		}

		this._p2 = this._p1;
		while (this._p2 == this._p1) {
			this._p2 = Math.floor(Math.random() * 3);
		}

		this._p3 = this._p2;
		while (this._p3 == this._p2 || this._p3 == this._p1) {
			this._p3 = Math.floor(Math.random() * 3);
		}

		this._p4 = 0;
		while (this._p4 == this._p1 || this._p4 == this._p2 || this._p4 == this._p3) {
			this._p4++;
		}
		this.logPlayerStatus();
	}
	
	public battleOne(): void {
		this.resetSide();
		this._engine._gameStateMachine.transition(GameState.PRE_BATTLE_SCREEN);
		this._PreBattleScreen.drawPreBattleScreen(this._players[this._p1].getName(), this._players[this._p2].getName(), 'FIRST ROUND');
		this._engine._pongGame = new PongGame(this._engine, this._mode, this._oppMode, this._players[this._p1], this._players[this._p2], 1);
		this.logPlayerStatus();
	}
	
	public battleTwo(): void {
		this.resetSide();
		this._engine._gameStateMachine.transition(GameState.PRE_BATTLE_SCREEN);
		this._PreBattleScreen.drawPreBattleScreen(this._players[this._p3].getName(), this._players[this._p4].getName(), 'SECOND ROUND');
		this._engine._pongGame = new PongGame(this._engine, this._mode, this._oppMode, this._players[this._p3], this._players[this._p4], 2);
		this.logPlayerStatus();
	}
	
	public tournamentMiddle(): void {
		this._engine._gameStateMachine.transition(GameState.TOURNAMENT_MIDDLE)
		this._PreBattleScreen.drawBrackets(this._players[this._p1], this._players[this._p2], this._players[this._p3], this._players[this._p4]);
	}

	public battleThree(): void {
		this.resetSide();
		this._engine._gameStateMachine.transition(GameState.PRE_BATTLE_SCREEN);

		this._p1 = 0;
		this._p2 = 0;
		this._p3 = 0;
		this._p4 = 0;
		for (let i = 0; i < this._players.length; i++) {
			if (this._players[i].getPosition() == 4 && this._p3 == 0) {
				this._p3 = i;
			}
			else if (this._players[i].getPosition() == 4 && this._p3 != 0 && i != this._p3) {
				this._p4 = i;
			}
		}
		if (this._oppMode == OpponentMode.SINGLE && this._players[this._p4].isBot() == false) {
			var temp = this._p4;
			this._p4 = this._p3;
			this._p3 = temp;
		}
		
		for (let i = 0; i < this._players.length; i++) {
			if (this._players[i].getPosition() == 3 && this._p1 == 0) {
				this._p1 = i;
			}
			else if (this._players[i].getPosition() == 3 && this._p1 != 0 && i != this._p1) {
				this._p2 = i;
			}
		}
		this._players[this._p1].setPosition(this._players[this._p1].getPosition() - 1);
		this._players[this._p2].setPosition(this._players[this._p2].getPosition() - 1);
		if (this._oppMode == OpponentMode.SINGLE && this._players[this._p2].isBot() == false) {
			var temp = this._p2;
			this._p2 = this._p1;
			this._p1 = temp;
		}


		this._PreBattleScreen.drawPreBattleScreen(this._players[this._p3].getName(), this._players[this._p4].getName(), 'BATTLE FOR 3RD PLACE');
		this._engine._pongGame = new PongGame(this._engine, this._mode, this._oppMode, this._players[this._p3], this._players[this._p4], 3);
		this.logPlayerStatus();
	}

	public battleFour(): void {
		this.resetSide();
		this._engine._gameStateMachine.transition(GameState.PRE_BATTLE_SCREEN);
		this._PreBattleScreen.drawPreBattleScreen(this._players[this._p1].getName(), this._players[this._p2].getName(), 'BATTLE FOR 1ST PLACE');
		this._engine._pongGame = new PongGame(this._engine, this._mode, this._oppMode, this._players[this._p1], this._players[this._p2], 4);
		this.logPlayerStatus();
	}

	public winScreen(): void {
		this.logPlayerStatus();
		this._engine._gameStateMachine.transition(GameState.GAME_OVER);
		this._p1 = 0;
		this._p2 = 0;
		this._p3 = 0;

		for (let i = 0; i < this._players.length; i++) {
			if (this._players[i].getPosition() == 1) {
				this._p1 = i;
			}
			else if (this._players[i].getPosition() == 2) {
				this._p2 = i;
			}
			else if (this._players[i].getPosition() == 3) {
				this._p3 = i;
			}
		}

		this._winScreen.drawWinScreen(this._players[this._p1].getName(), this._players[this._p2].getName(), this._players[this._p3].getName())
	}

	private logPlayerStatus() {
		console.log("p1 > name:", this._players[this._p1].getName(), "| position:", this._players[this._p1].getPosition(), "| side:", this._players[this._p1].getSide(), "| isbot:", this._players[this._p1].isBot());
		console.log("p2 > name:", this._players[this._p2].getName(), "| position:", this._players[this._p2].getPosition(), "| side:", this._players[this._p2].getSide(), "| isbot:", this._players[this._p2].isBot());
		console.log("p3 > name:", this._players[this._p3].getName(), "| position:", this._players[this._p3].getPosition(), "| side:", this._players[this._p3].getSide(), "| isbot:", this._players[this._p3].isBot());
		console.log("p4 > name:", this._players[this._p4].getName(), "| position:", this._players[this._p4].getPosition(), "| side:", this._players[this._p4].getSide(), "| isbot:", this._players[this._p4].isBot());
	}

	private resetSide() {
		this._players[this._p1].setSide('default');
		this._players[this._p2].setSide('default');
		this._players[this._p3].setSide('default');
		this._players[this._p4].setSide('default');
	}
}