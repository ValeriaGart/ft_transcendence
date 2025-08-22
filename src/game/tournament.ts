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
	private _pnumbers: number[];
	private _waiting: number = 0;
	private _ready: number = 0;
	private _received: boolean = false;

	private _mode: GameMode;
	private _oppMode: OpponentMode;

	// private _start: boolean = false;

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

		this._pnumbers = [1234567890 ,this._p1, this._p2, this._p3, this._p4];
		// this.logPlayerStatus();
	}

	private broadcastGameState(): void {
		// console.log("host has sent message");
		const msg = {
			"type": 7,
			"roomId": this._engine._roomID,
			"_gameState": this._pnumbers
		};
		const gameStateString = JSON.stringify(msg);
		this._engine._ws.sendMessage(gameStateString);
	}

	private parseMessage(message: MessageEvent): void {
		var msg = JSON.parse(message.data);
		// console.log('client has reveived message: ', msg);
		if (msg == "ready") {
			this._ready += 1;
		}
		else if (msg == "waiting") {
			this._waiting += 1;
		}
		else if (msg[0] == 1234567890) {
			this._p1 = msg[1];
			this._p2 = msg[2];
			this._p3 = msg[3];
			this._p4 = msg[4];
			this._received = true;
		}
	}

	public async preBattle(number: number) {
		if (this._oppMode == OpponentMode.ONLINE) {
			this._engine._ws.ws.onmessage = (message) => {
				this.parseMessage(message);
			}
			if (this._engine._urp == 1) {
				while (this._waiting < 3) {
					this._PreBattleScreen.drawWaitScreen();
					await new Promise(resolve => setTimeout(resolve, 50));
				}
				this._waiting = 0;
				this.broadcastGameState();
			}
			else {
				this._PreBattleScreen.drawWaitScreen();
				await new Promise(resolve => setTimeout(resolve, 500));
				const msg = {
					"type": 7,
					"roomId": this._engine._roomID,
					"_gameState": "waiting"
				};
				const gameStateString = JSON.stringify(msg);
				this._engine._ws.sendMessage(gameStateString);
				console.log("sent waiting");
				while (this._received == false) {
					this._PreBattleScreen.drawWaitScreen();
					await new Promise(resolve => setTimeout(resolve, 50));
				}
				this._received = false;
			}
		}
		if (number === 1)
			this.battleOne();
		if (number === 2)
			this.battleTwo();
		if (number === 3)
			this.battleThree();
		if (number === 4)
			this.battleFour();
	}
	
	public async battleOne() {
		this.resetSide();
		this._engine._gameStateMachine.transition(GameState.PRE_BATTLE_SCREEN);
		// this.logPlayerStatus();
		if (this._oppMode == OpponentMode.ONLINE) {
			while (this._ready < 3) {
				this._PreBattleScreen.drawPreBattleScreen(this._players[this._p1].getName(), this._players[this._p2].getName(), 'FIRST ROUND');
				await new Promise(resolve => setTimeout(resolve, 50));
			}
		}
		this._ready = 0;
		this._engine._pongGame = new PongGame(this._engine, this._mode, this._oppMode, this._players[this._p1], this._players[this._p2], this._players[this._p3], this._players[this._p4], 1);
	}
	
	public async battleTwo(){
		this.resetSide();
		this._engine._gameStateMachine.transition(GameState.PRE_BATTLE_SCREEN);
		// this.logPlayerStatus();
		if (this._oppMode == OpponentMode.ONLINE) {
			while (this._ready < 3) {
				this._PreBattleScreen.drawPreBattleScreen(this._players[this._p3].getName(), this._players[this._p4].getName(), 'SECOND ROUND');
				await new Promise(resolve => setTimeout(resolve, 50));
			}
		}
		this._ready = 0;
		this._engine._pongGame = new PongGame(this._engine, this._mode, this._oppMode, this._players[this._p3], this._players[this._p4], this._players[this._p1], this._players[this._p2], 2);
	}
	
	public tournamentMiddle(): void {
		if (this._oppMode == OpponentMode.ONLINE) {
			this._engine._ws.ws.onmessage = (message) => {
				this.parseMessage(message);
			}
		}
		this._engine._gameStateMachine.transition(GameState.TOURNAMENT_MIDDLE)
		this._PreBattleScreen.drawBrackets(this._players[this._p1], this._players[this._p2], this._players[this._p3], this._players[this._p4]);
	
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
		this._pnumbers = [1234567890 ,this._p1, this._p2, this._p3, this._p4];
	}

	public async battleThree() {
		this.resetSide();
		this._engine._gameStateMachine.transition(GameState.PRE_BATTLE_SCREEN);
		// this.logPlayerStatus();
		if (this._oppMode == OpponentMode.ONLINE) {
			while (this._ready < 3) {
				this._PreBattleScreen.drawPreBattleScreen(this._players[this._p3].getName(), this._players[this._p4].getName(), 'BATTLE FOR 3RD PLACE');
				await new Promise(resolve => setTimeout(resolve, 50));
			}
			this._ready = 0;
			this._engine._pongGame = new PongGame(this._engine, this._mode, this._oppMode, this._players[this._p3], this._players[this._p4], this._players[this._p1], this._players[this._p2], 3);
		}
	}

	public async battleFour() {
		this.resetSide();
		this._engine._gameStateMachine.transition(GameState.PRE_BATTLE_SCREEN);
		// this.logPlayerStatus();
		if (this._oppMode == OpponentMode.ONLINE) {
			while (this._ready < 3) {
				this._PreBattleScreen.drawPreBattleScreen(this._players[this._p1].getName(), this._players[this._p2].getName(), 'BATTLE FOR 1ST PLACE');
				await new Promise(resolve => setTimeout(resolve, 50));
			}
		}
		this._ready = 0;
		this._engine._pongGame = new PongGame(this._engine, this._mode, this._oppMode, this._players[this._p1], this._players[this._p2],  this._players[this._p3], this._players[this._p4], 4);
	}

	public winScreen(): void {
		// this.logPlayerStatus();
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

		const msg = {
			"type": 5,
			"roomId": this._engine._roomID,
			"status": "finished"
		}
		console.log('Sending finish tournament msg:', JSON.stringify(msg));
		this._engine._ws.sendMessage(JSON.stringify(msg));

		this._winScreen.drawWinScreen(this._players[this._p1].getName(), this._players[this._p2].getName(), this._players[this._p3].getName())
	}

	private logPlayerStatus() {
		console.log("contestant1 > name:", this._players[this._p1].getName(), "| position:", this._players[this._p1].getPosition(), "| side:", this._players[this._p1].getSide(), "| isbot:", this._players[this._p1].isBot());
		console.log("contestant2 > name:", this._players[this._p2].getName(), "| position:", this._players[this._p2].getPosition(), "| side:", this._players[this._p2].getSide(), "| isbot:", this._players[this._p2].isBot());
		console.log("contestant3 > name:", this._players[this._p3].getName(), "| position:", this._players[this._p3].getPosition(), "| side:", this._players[this._p3].getSide(), "| isbot:", this._players[this._p3].isBot());
		console.log("contestant4 > name:", this._players[this._p4].getName(), "| position:", this._players[this._p4].getPosition(), "| side:", this._players[this._p4].getSide(), "| isbot:", this._players[this._p4].isBot());
	}

	private resetSide() {
		this._players[this._p1].setSide('default');
		this._players[this._p2].setSide('default');
		this._players[this._p3].setSide('default');
		this._players[this._p4].setSide('default');
	}
}