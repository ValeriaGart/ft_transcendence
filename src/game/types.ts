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
	TOURNAMENT = 'tournament',
	TEAMS = 'teams',
	BREAKOUT = 'breakout'
}

export enum OpponentMode {
	SINGLE = 'single player',
	MULTI = 'local multi player',
	ONLINE = 'online multi player'
}

export interface GameStats {
	ballPosition: { x: number; y: number};
	ballVelocity: { x: number; y: number};
	paddlePositions: { left: number; right: number, ml: number, mr: number};
	paddleVelocity: { left: number; right: number, ml: number, mr: number};
	paddleDirection: { left: number; right: number, ml: number, mr: number};
	scores: { left: number; right: number};
	pnumber: number;
}

export interface BreakoutStats {
	ball1Position: { x: number; y: number};
	ball1Velocity: { x: number; y: number};
	ball2Position: { x: number; y: number};
	ball2Velocity: { x: number; y: number};
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
	winner: string;
	pauseBG: string;
	paddle: string;
	ball: string;
}

export type PaddleSide = 'left' | 'right';
export type ExtraPaddleSide = 'ml' | 'mr';