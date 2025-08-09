import { BotAI } from "./botAI.js";

export class Player {
	private	_name: string;
	private	_position: number;
	private _isBot: boolean;
	public _side: string;
	private _pnumber: number;

	public _AI: BotAI;

	constructor(name: string, pos: number, isBot: boolean, pnumber: number, side?: string) {
		this._name = name;
		this._position = pos;
		this._isBot = isBot;
		this._side = side || 'default';
		this._AI = new BotAI(this._side);
		this._pnumber = pnumber;
	}

	public getSide(): string {
		return this._side;
	}

	public getName(): string {
		return this._name;
	}

	public getPosition(): number {
		return this._position;
	}

	public getPnumber(): number {
		return this._pnumber;
	}

	public isBot(): boolean {
		return this._isBot;
	}

	public setPosition(pos: number): void {
		this._position = pos;
	}

	public setSide(side: string): void {
		this._side = side;
		console.log('side set to:', this._side);
		this._AI.setSide(side);
	}
}