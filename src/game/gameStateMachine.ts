import { GameEngine } from "./gameEngine.js";
import { GameState } from "../types.js";

export class GameStateMachine {
	private _currentState: GameState = GameState.START;
	private _engine: GameEngine;

	constructor(engine: GameEngine) {
		this._engine = engine;
	}

	public getCurrentState() {
		return this._currentState;
	}

	public transition(state: GameState) {
		this._currentState = state;
		console.log("switched state to: ", state);
	}

	public update() {
		switch (this._currentState) {
			case GameState.START:
				this.handleStartState();
				break;
			case GameState.SELECT:
				this.handleSelectState();
				break;
			case GameState.GAME:
				this.handleGameState();
				break;
			case GameState.PAUSED:
				this.handlePausedState();
				break;
			case GameState.GAME_OVER:
			case GameState.PRE_BATTLE_SCREEN:
			case GameState.TOURNAMENT_MIDDLE:
				break;
			}
	}

	private handleStartState() {
		this._engine._startScreen.drawStartScreen();
	}

	private handleSelectState() {
		this._engine._selectScreen.drawSelectScreen();
	}

	private handleGameState() {
		this._engine._pongGame.drawGameScreen();
	}

	private handlePausedState() {
		this._engine._pongGame._pauseScreen.drawPauseScreen();
	}
}
