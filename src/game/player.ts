import { BotAI } from "./botAI.js";

export class Player {
	private	_name: string = "default";
	private	_position: number = 0;
	private _isBot: boolean = true;

	public _AI: BotAI;

	constructor(name?: string, pos?: number, isBot?: boolean) {
		this._name = name || this._name;
		this._position = pos || this._position;
		this._isBot = isBot || this._isBot;
		this._AI = new BotAI();
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

}