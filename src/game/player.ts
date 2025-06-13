import { PaddleSide } from "../types.js";
import { BotAI } from "./botAI.js";

export class Player {
	private	_name: string = "player";
	private	_position: number = 0;
	private _isBot: boolean = true;
	private _side: string = 'left';

	public AI: BotAI;

	constructor(name: string, pos: number, isBot: boolean, side?: string) {
		this._name = name;
		this._position = pos;
		this._isBot = isBot;
		this.AI = new BotAI();
		this._side = side || this._side;
	}

	public getName(): string {
		return this._name;
	}

	public getPosition(): number {
		return this._position;
	}

	public getSide(): string {
		return this._side;
	}

	public getBot(): boolean {
		return this._isBot;
	}

	public setPosition(pos: number): void {
		this._position = pos;
	}

}