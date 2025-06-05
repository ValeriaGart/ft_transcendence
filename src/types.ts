interface GameState {
	ballPosition: { x: number; y: number};
	ballVelocity: { x: number; y: number};
	paddlePositions: { left: number; right: number};
	scores: { left: number; right: number};
}

type PaddleSide = 'left' | 'right';