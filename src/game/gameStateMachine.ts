import { GameEngine } from "./gameEngine.js";
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
		console.log("switched state to: ", state);
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
				this.handleGameOverScreen();
				break;
			case GameState.ROUND_ONE:
			case GameState.ROUND_TWO:
			case GameState.ROUND_THREE:
			case GameState.ROUND_FOUR:
			case GameState.TOURNAMENT_MIDDLE:
				this.handlePreBattleScreen();
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

	private handleGameOverScreen() {
		//todo
	}

	private handlePreBattleScreen() {
		//todo
	}
}
