import { PADDLE_HEIGHT, PADDLE_SPEED } from '../constants.js';
import { PongGame } from './pongGame.js';
import GameEngine from './gameEngine.js';
import { GameState } from '../types.js';
import { SelectScreen } from './selectScreen.js';

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
				this.engine.selectScreen.currentOption = (this.engine.selectScreen.currentOption -1 + this.engine.selectScreen.options.length) % this.engine.selectScreen.options.length;
				break;
			case 'ArrowDown':
				this.engine.selectScreen.currentOption = (this.engine.selectScreen.currentOption + 1) % this.engine.selectScreen.options.length;
				break;
			case 'Enter':
				this.engine.selectScreen.selectedText = this.engine.selectScreen.options[this.engine.selectScreen.currentOption];
				console.log(`selected mode: ${this.engine.selectScreen.selectedText}`);
				this.engine.startGame(this.engine.selectScreen.currentOption);
				this.engine.gameStateMachine.transition(GameState.GAME);
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

	private movePaddle(side: 'left' | 'right', direction: number): void {
		const currentPosition = this.engine.pongGame.gameStats.paddlePositions[side];
		const newPosition = currentPosition + (direction * 10);

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
}