export enum GameState {
	START,
	SELECT,
	GAME,
	PAUSED,
	GAME_OVER
}

export interface GameStats {
	ballPosition: { x: number; y: number};
	ballVelocity: { x: number; y: number};
	paddlePositions: { left: number; right: number};
	scores: { left: number; right: number};
}

export type PaddleSide = 'left' | 'right';