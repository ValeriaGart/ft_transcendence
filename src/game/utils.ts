export function getRandomDirection(): number {
	return Math.random() > 0.5 ? 1 : -1;
}

export function getRandomAngle(): number {
	return  Math.random() * Math.PI / 4 - Math.PI / 8;
}