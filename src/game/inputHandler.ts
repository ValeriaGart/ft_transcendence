import GameEngine from './gameEngine.ts';
import { GameState, OpponentMode } from './types.ts';

export class InputHandler {
	private _engine: GameEngine;
	private _oppMode: OpponentMode = OpponentMode.SINGLE;
	private _keysPressed: { [key: string]: boolean } = {};

	constructor(engine: GameEngine) {
		this._engine = engine;
	}

	public setupEventListeners(): void {
		window.addEventListener('keydown', this.handleKeyDown.bind(this));
		window.addEventListener('keyup', this.handleKeyUp.bind(this));

		window.addEventListener('blur', () => {
			Object.keys(this._keysPressed).forEach(key => {
				this._keysPressed[key] = false;
			});
		});
	}

	private handleKeyDown(event: KeyboardEvent): void {
		this._keysPressed[event.key] = true;

		switch(this._engine._gameStateMachine.getCurrentState()) {
			case GameState.START:
				this.handleStartScreen();
				break;
			case GameState.OPPONENT:
				this.handleOpponentScreen();
				break;
			case GameState.SELECT:
				this.handleSelectScreen();
				break;
			case GameState.GAME:
				this.handleGameScreenDown(event);
				break;
			case GameState.PAUSED:
				this.handlePauseScreen();
				break;
			case GameState.GAME_OVER:
				this.handleGameOverScreen();
				break;
			case GameState.PRE_BATTLE_SCREEN:
				this.handlePreBattleScreen();
				break;
			case GameState.TOURNAMENT_MIDDLE:
				this.handleTournamentMiddle();
		}
	}

	private handleKeyUp(event:KeyboardEvent): void {
		this._keysPressed[event.key] = false;
		switch(this._engine._gameStateMachine.getCurrentState()) {
			case GameState.GAME:
				this.handleGameScreenUp(event);
				break;
		}
	}

	private handleStartScreen(): void {
		if (this._keysPressed['Enter']) {
			console.log("pressed start");
			this._engine._gameStateMachine.transition(GameState.OPPONENT);
		}
	}

	private handleSelectScreen(): void {
		if (this._keysPressed['ArrowUp']) {
			var currentIndex = this._engine._selectScreen._options.indexOf(this._engine._selectScreen._currentOption);
			this._engine._selectScreen._currentOption = this._engine._selectScreen._options[
				(currentIndex - 1 + this._engine._selectScreen._options.length) % this._engine._selectScreen._options.length];
		}

		if (this._keysPressed['ArrowDown']) {
			var currentIndex = this._engine._selectScreen._options.indexOf(this._engine._selectScreen._currentOption);
			this._engine._selectScreen._currentOption = this._engine._selectScreen._options[
				(currentIndex + 1) % this._engine._selectScreen._options.length];
		}

		if (this._keysPressed['Enter']) {
			console.log("selected mode: ", this._engine._selectScreen._currentOption);
			this._engine._gameStateMachine.transition(GameState.GAME);
			this._engine.startGame(this._engine._selectScreen._currentOption, this._oppMode);
		}

		if (this._keysPressed['Escape']) {
			this._engine._gameStateMachine.transition(GameState.OPPONENT);
		}
	}

	private handleOpponentScreen(): void {
		if (this._keysPressed['ArrowUp']) {
			var currentIndex = this._engine._opponentScreen._options.indexOf(this._engine._opponentScreen._currentOption);
			this._engine._opponentScreen._currentOption = this._engine._opponentScreen._options[
				(currentIndex - 1 + this._engine._opponentScreen._options.length) % this._engine._opponentScreen._options.length];
		}

		if (this._keysPressed['ArrowDown']) {
			var currentIndex = this._engine._opponentScreen._options.indexOf(this._engine._opponentScreen._currentOption);
			this._engine._opponentScreen._currentOption = this._engine._opponentScreen._options[
				(currentIndex + 1) % this._engine._opponentScreen._options.length];
		}

		if (this._keysPressed['Enter']) {
			console.log("selected mode: ", this._engine._opponentScreen._currentOption);
			this._oppMode = this._engine._opponentScreen._currentOption;
			if (this._oppMode == OpponentMode.ONLINE) {
				this._engine._gameStateMachine.transition(GameState.START);
			}
			else {
				this._engine._gameStateMachine.transition(GameState.SELECT);
			}
		}
	}

	private handleGameScreenDown(event: KeyboardEvent): void {
		const gameStats = this._engine._pongGame._gameStats.paddleDirection;

		if ((!this._engine._pongGame._p1.isBot() && event.location == 0) || (this._engine._pongGame._p1.isBot() && event.location == 1)) {
			if (this._keysPressed['w']) gameStats.left = -1;
			if (this._keysPressed['s']) gameStats.left = +1;
		}
		
		if ((!this._engine._pongGame._p2.isBot() && event.location == 0) || (this._engine._pongGame._p2.isBot() && event.location == 1)) {
			if (this._keysPressed['ArrowUp']) gameStats.right = -1;
			if (this._keysPressed['ArrowDown']) gameStats.right = +1;
		}
		
		if (this._keysPressed['Escape']) {
			this._engine._gameStateMachine.transition(GameState.PAUSED);
		}
	}

	private handleGameScreenUp(event: KeyboardEvent): void {
		const gameStats = this._engine._pongGame._gameStats.paddleDirection;

		if ((!this._engine._pongGame._p1.isBot() && event.location == 0) ||(this._engine._pongGame._p1.isBot() && event.location == 1)) {
			if (!this._keysPressed['w'] && !this._keysPressed['s']) gameStats.left = 0;
		}
		
		if ((!this._engine._pongGame._p2.isBot() && event.location == 0) ||(this._engine._pongGame._p2.isBot() && event.location == 1)) {
			if (!this._keysPressed['ArrowUp'] && !this._keysPressed['ArrowDown']) gameStats.right = 0;
		}
	}
	
	private handlePauseScreen(): void {
		if (this._keysPressed['Escape']) {
			this._engine._gameStateMachine.transition(GameState.GAME);
		}
		if (this._keysPressed['Enter']) {
			this._engine._gameStateMachine.transition(GameState.SELECT);
		}
	}
		
	private handleGameOverScreen(): void {
		if (this._keysPressed['Enter']) {
			this._engine._gameStateMachine.transition(GameState.SELECT);
		}
	}

	private handlePreBattleScreen(): void {
		if (this._keysPressed['Enter']) {
			this._engine._gameStateMachine.transition(GameState.GAME);
		}
	}

	private handleTournamentMiddle(): void {
		if (this._keysPressed['Enter']) {
			this._engine.startRoundThree();
		}
	}
}