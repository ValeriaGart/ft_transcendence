import PongGame, { GameEngine } from "./gameEngine.js";
import { GameState } from "../types.js";

export class GameStateMachine {
	private currentState: GameState = GameState.START;
	private engine: GameEngine;

	constructor(engine: GameEngine) {
		this.engine = engine;
	}

	public getCurrentState() {
		return this.currentState;
	}

	public transition(state: GameState) {
		this.currentState = state;
	}

	public update() {
		switch (this.currentState) {
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
				this.handleGameOverState();
				break;
		}
	}

	private handleStartState() {
		this.engine.startScreen.drawStartScreen();
	}

	private handleSelectState() {
		this.engine.selectScreen.drawSelectScreen();
	}

	private handleGameState() {
		this.engine.pongGame.drawGameScreen();
	}

	private handlePausedState() {
		this.engine.pongGame.pauseScreen.drawPauseScreen();
	}

	private handleGameOverState() {
		//todo
	}
}
