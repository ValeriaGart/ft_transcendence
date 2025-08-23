export enum GameState {
	START,
	OPPONENT,
	SELECT,
	GAME,
	PAUSED,
	GAME_OVER,
	PRE_BATTLE_SCREEN,
	TOURNAMENT_MIDDLE
}

export enum GameMode {
	INFINITE = 'infinite',
	BEST_OF = 'best of 5',
	TOURNAMENT = 'tournament'
}

export enum OpponentMode {
	SINGLE = 'single player',
	MULTI = 'local multi player',
	ONLINE = 'online multi player'
}

export interface GameStats {
	ballPosition: { x: number; y: number};
	ballVelocity: { x: number; y: number};
	paddlePositions: { left: number; right: number};
	paddleVelocity: { left: number; right: number};
	paddleDirection: { left: number; right: number};
	scores: { left: number; right: number};
	pnumber: number;
}

export interface Colours {
	background: string;
	foregroundMain: string;
	foregroundSubtle: string;
	winnter: string;
	pauseBG: string;
}

export type PaddleSide = 'left' | 'right';