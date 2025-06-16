import { PaddleSide } from "../types.js";
import { BotAI } from "./botAI.js";

export class Player {
	private	_name: string = "default";
	private	_position: number = 0;
	private _isBot: boolean = false;
	public _side: string;

	public _AI: BotAI;

	constructor(name?: string, pos?: number, isBot?: boolean, side?: string) {
		this._name = name || this._name;
		this._position = pos || this._position;
		this._isBot = isBot || this._isBot;
		this._side = side || 'right';
		this._AI = new BotAI(this._side);
	}

	public getName(): string {
		return this._name;
	}

	public getPosition(): number {
		return this._position;
	}

	public getBot(): boolean {
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