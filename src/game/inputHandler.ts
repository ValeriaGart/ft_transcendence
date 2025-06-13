import { PADDLE_HEIGHT, PADDLE_SPEED } from '../constants.js';
import GameEngine from './gameEngine.js';
import { GameState } from '../types.js';

export class InputHandler {
	private engine: GameEngine;

	constructor(engine: GameEngine) {
		this.engine = engine;
	}

	public setupEventListeners(): void {
		window.addEventListener('keydown', this.handleKeyDown.bind(this));
	}

	private handleKeyDown(event: KeyboardEvent): void {
		switch(this.engine.gameStateMachine.getCurrentState()) {
			case GameState.START:
				this.handleStartScreen(event);
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
			case GameState.ROUND_ONE:
			case GameState.ROUND_TWO:
			case GameState.ROUND_THREE:
			case GameState.ROUND_FOUR:
				this.handlePreBattleScreen(event);
				break;
			case GameState.TOURNAMENT_MIDDLE:
				this.handleTournamentMiddle(event);
		}
	}

	private handleStartScreen(event: KeyboardEvent): void {
		switch (event.key) {
			case 'Enter':
				console.log("pressed start");
				this.engine.gameStateMachine.transition(GameState.SELECT);
				break;
		}
	}

	private handleSelectScreen(event: KeyboardEvent): void {
		switch(event.key) {
			case 'ArrowUp':
				var currentIndex = this.engine.selectScreen.options.indexOf(this.engine.selectScreen.currentOption);
				this.engine.selectScreen.currentOption = this.engine.selectScreen.options[
					(currentIndex - 1 + this.engine.selectScreen.options.length) % this.engine.selectScreen.options.length];
				break;
			case 'ArrowDown':
				var currentIndex = this.engine.selectScreen.options.indexOf(this.engine.selectScreen.currentOption);
				this.engine.selectScreen.currentOption = this.engine.selectScreen.options[
					(currentIndex + 1) % this.engine.selectScreen.options.length];
				break;
			case 'Enter':
				console.log("selected mode: ", this.engine.selectScreen.currentOption);
				this.engine.gameStateMachine.transition(GameState.GAME);
				this.engine.startGame(this.engine.selectScreen.currentOption);
				break;
		}
	}

	private handleGameScreen(event: KeyboardEvent): void {
		switch(event.key) {
			case 'w':
				this.movePaddle('left', -PADDLE_SPEED);
				break;
			case 's':
				this.movePaddle('left', PADDLE_SPEED);
				break;
			case 'ArrowUp':
				this.movePaddle('right', -PADDLE_SPEED);
				break;
			case 'ArrowDown':
				this.movePaddle('right', PADDLE_SPEED);
				break;
			case 'Escape':
				this.engine.gameStateMachine.transition(GameState.PAUSED);
				break;
			}
		}

	private movePaddle(side: 'left' | 'right', direction: number): void {
		const currentPosition = this.engine.pongGame.gameStats.paddlePositions[side];
		const newPosition = currentPosition + (direction);
		
		if (newPosition < 0) {
			this.engine.pongGame.gameStats.paddlePositions[side] = 0;
		}
		else if(newPosition > this.engine.pongGame.engine.canvas.height - PADDLE_HEIGHT) {
			this.engine.pongGame.gameStats.paddlePositions[side] = this.engine.pongGame.engine.canvas.height - PADDLE_HEIGHT;
		}
		else {
			this.engine.pongGame.gameStats.paddlePositions[side] = newPosition;
		}
	}
	
	private handlePauseScreen(event: KeyboardEvent): void {
		switch (event.key) {
			case 'Escape':
				this.engine.gameStateMachine.transition(GameState.GAME);
				break;
			case 'Enter':
				this.engine.gameStateMachine.transition(GameState.SELECT);
				break;
		}
	}
		
	private handleGameOverScreen(event: KeyboardEvent): void {
		switch (event.key) {
			case 'Enter':
				this.engine.gameStateMachine.transition(GameState.SELECT);
				break;
		}
	}

	private handlePreBattleScreen(event: KeyboardEvent): void {
		switch (event.key) {
			case 'Enter':
				this.engine.gameStateMachine.transition(GameState.GAME);
				break;
		}
	}

	private handleTournamentMiddle(event: KeyboardEvent): void {
		switch (event.key) {
			case 'Enter':
				this.engine.startRoundThree();
				break;
		}
	}
}