import GameEngine from './gameEngine.ts';
import { GameState, OpponentMode } from './types.ts';

export class InputHandler {
	private _engine: GameEngine;
	private _oppMode: OpponentMode = OpponentMode.SINGLE;

	constructor(engine: GameEngine) {
		this._engine = engine;
	}

	public setupEventListeners(): void {
		window.addEventListener('keydown', this.handleKeyDown.bind(this));
		window.addEventListener('keyup', this.handleKeyUp.bind(this));
	}

	private handleKeyDown(event: KeyboardEvent): void {
		switch(this._engine._gameStateMachine.getCurrentState()) {
			case GameState.START:
				this.handleStartScreen(event);
				break;
			case GameState.OPPONENT:
				this.handleOpponentScreen(event);
				break;
			case GameState.SELECT:
				this.handleSelectScreen(event);
				break;
			case GameState.GAME:
				this.handleGameScreen(event);
				break;
			case GameState.PAUSED:
				this.handlePauseScreen(event);
				break;
			case GameState.GAME_OVER:
				this.handleGameOverScreen(event);
				break;
			case GameState.PRE_BATTLE_SCREEN:
				this.handlePreBattleScreen(event);
				break;
			case GameState.TOURNAMENT_MIDDLE:
				this.handleTournamentMiddle(event);
		}
	}

	private handleKeyUp(event:KeyboardEvent): void {
		switch(this._engine._gameStateMachine.getCurrentState()) {
			case GameState.GAME:
				this.handleGameScreenDown(event);
				break;
		}
	}

	private handleStartScreen(event: KeyboardEvent): void {
		switch (event.key) {
			case 'Enter':
				console.log("pressed start");
				this._engine._gameStateMachine.transition(GameState.OPPONENT);
				break;
		}
	}

	private handleSelectScreen(event: KeyboardEvent): void {
		switch(event.key) {
			case 'ArrowUp':
				var currentIndex = this._engine._selectScreen._options.indexOf(this._engine._selectScreen._currentOption);
				this._engine._selectScreen._currentOption = this._engine._selectScreen._options[
					(currentIndex - 1 + this._engine._selectScreen._options.length) % this._engine._selectScreen._options.length];
				break;
			case 'ArrowDown':
				var currentIndex = this._engine._selectScreen._options.indexOf(this._engine._selectScreen._currentOption);
				this._engine._selectScreen._currentOption = this._engine._selectScreen._options[
					(currentIndex + 1) % this._engine._selectScreen._options.length];
				break;
			case 'Enter':
				console.log("selected mode: ", this._engine._selectScreen._currentOption);
				this._engine._gameStateMachine.transition(GameState.GAME);
				this._engine.startGame(this._engine._selectScreen._currentOption, this._oppMode);
				break;
			case 'Escape':
				this._engine._gameStateMachine.transition(GameState.OPPONENT);
		}
	}

	private handleOpponentScreen(event: KeyboardEvent): void {
		switch(event.key) {
			case 'ArrowUp':
				var currentIndex = this._engine._opponentScreen._options.indexOf(this._engine._opponentScreen._currentOption);
				this._engine._opponentScreen._currentOption = this._engine._opponentScreen._options[
					(currentIndex - 1 + this._engine._opponentScreen._options.length) % this._engine._opponentScreen._options.length];
				break;
			case 'ArrowDown':
				var currentIndex = this._engine._opponentScreen._options.indexOf(this._engine._opponentScreen._currentOption);
				this._engine._opponentScreen._currentOption = this._engine._opponentScreen._options[
					(currentIndex + 1) % this._engine._opponentScreen._options.length];
				break;
			case 'Enter':
				console.log("selected mode: ", this._engine._opponentScreen._currentOption);
				this._oppMode = this._engine._opponentScreen._currentOption;
				if (this._oppMode == OpponentMode.ONLINE) {
					this._engine._gameStateMachine.transition(GameState.START);
				}
				else {
					this._engine._gameStateMachine.transition(GameState.SELECT);
				}
				break;
		}
	}

	private handleGameScreen(event: KeyboardEvent): void {
		switch(event.key) {
			case 'w':
				this._engine._pongGame._gameStats.paddleDirection.left = -1;
				break;
			case 's':
				this._engine._pongGame._gameStats.paddleDirection.left = 1;
				break;
			case 'ArrowUp':
				this._engine._pongGame._gameStats.paddleDirection.right = -1;
				break;
			case 'ArrowDown':
				this._engine._pongGame._gameStats.paddleDirection.right = 1;
				break;
			case 'Escape':
				this._engine._gameStateMachine.transition(GameState.PAUSED);
				break;
		}
	}

	private handleGameScreenDown(event: KeyboardEvent): void {
		switch(event.key) {
			case 'w':
				this._engine._pongGame._gameStats.paddleDirection.left = 0;
				break;
			case 's':
				this._engine._pongGame._gameStats.paddleDirection.left = 0;
				break;
			case 'ArrowUp':
				this._engine._pongGame._gameStats.paddleDirection.right = 0;
				break;
			case 'ArrowDown':
				this._engine._pongGame._gameStats.paddleDirection.right = 0;
				break;
		}
	}
	
	private handlePauseScreen(event: KeyboardEvent): void {
		switch (event.key) {
			case 'Escape':
				this._engine._gameStateMachine.transition(GameState.GAME);
				break;
			case 'Enter':
				this._engine._gameStateMachine.transition(GameState.SELECT);
				break;
		}
	}
		
	private handleGameOverScreen(event: KeyboardEvent): void {
		switch (event.key) {
			case 'Enter':
				this._engine._gameStateMachine.transition(GameState.SELECT);
				break;
		}
	}

	private handlePreBattleScreen(event: KeyboardEvent): void {
		switch (event.key) {
			case 'Enter':
				this._engine._gameStateMachine.transition(GameState.GAME);
				break;
		}
	}

	private handleTournamentMiddle(event: KeyboardEvent): void {
		switch (event.key) {
			case 'Enter':
				this._engine.startRoundThree();
				break;
		}
	}
}