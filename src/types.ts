export enum GameState {
	START,
	SELECT,
	GAME,
	PAUSED,
	GAME_OVER,
	ROUND_ONE,
	ROUND_TWO,
	ROUND_THREE,
	ROUND_FOUR,
	TOURNAMENT_MIDDLE
}

export enum GameMode {
	INFINITE = 'infinite',
	BEST_OF = 'best of 5',
	TOURNAMENT = 'tournament'
}

export enum OpponentMode {
	SINGLE = 'single player',
	MULTI = 'multi player'
}

export interface GameStats {
	ballPosition: { x: number; y: number};
	ballVelocity: { x: number; y: number};
	paddlePositions: { left: number; right: number};
	scores: { left: number; right: number};
}

export type PaddleSide = 'left' | 'right';