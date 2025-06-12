import { BotAI } from "./botAI.js";

export class Player {
	private	_name: string = "player";
	private	_position: number = 0;
	private _isBot: boolean = true;

	public AI: BotAI;

	constructor(name: string, pos: number, isBot: boolean) {
		this._name = name;
		this._position = pos;
		this._isBot = isBot;
		this.AI = new BotAI();
	}

	public getName(): string {
		return this._name;
	}

	public getPosition(): number {
		return this._position;
	}

	private setPosition(pos: number): void {
		this._position = pos;
	}
}