
import ProfileService from "../services/profile.service.js";


class RoomService {
	constructor(websocketService, emojiService) {
		console.log("[RoomService] constructor");
		this.rooms = [];
		this.WebsocketService = websocketService;
		this.EmojiService = emojiService;

	}


		createUniqueId() {
		let id;
		let isUnique = true;
		let count = 0;
		while (1) {
			isUnique = true;
			id = this.EmojiService.generateEmojiId();
			if (this.rooms.length === 0) {
				break ;
			}
			for (let r of this.rooms) {
				if (id === r.id) {
					console.log("duplicate, renewing id");
					isUnique = false ;
					count++;
					break ;
				}
			}
			if (id && isUnique === true) {
				break ;
			}
			if (count > 15) {
				throw new Error ('[createUniqueId] no unique room ID can be created, aborting');
			}
		}
		return (id);
	}
		
	
	async createRoom(connection, message) {
		const room = {
			id: this.createUniqueId(),
			gameMode: message.gameMode,
			oppMode: message.oppMode,
			players: message.players
		};

		/* determine ID of real players and set accepted variable accordingly */
		let pnumber_count = 1;
		for (let p of room.players) {
			if (p.ai != true) {
				const dbResult = await ProfileService.getIdByNick(p.nick);
				p.id = dbResult.userId;
				p.wsclient = await this.WebsocketService.getWsClientById(p.id);
				if (!p.wsclient) {
					throw new Error ("[RoomService] No connected user found for invited players, cancelling match.");
				}
				if (p.id === connection.userId) {
					p.accepted = "accepted";
				}
				else {
					p.accepted = "pending";
				}
				
			}
			else {
				p.accepted = "accepted";
			}
			p.pnumber = pnumber_count;
			pnumber_count++;
		}

		this.rooms.push(room);
		console.log("[RoomService] new room was created");

		/* printing rooms for debugging */
		console.debug(JSON.stringify(this.rooms, (key, value) => {
			if (key === "wsclient") return undefined; // Exclude wsclient
			return value;
		}, 2));
		
		return (room);
	}

		
	async destroyRoom(todeleteId) {
		let count = 0;
		console.debug("[RoomService] rooms[] length: ", this.rooms.length);
		for (let r of this.rooms) {
			if (r.id === todeleteId) {
				console.log("deleting ", todeleteId);
				this.rooms.splice(count, 1);
				continue ;
			}
			count++;
		}
		console.debug("[RoomService] rooms[] length after destroyRoom function: ", this.rooms.length);
		}
	


}

export default RoomService;