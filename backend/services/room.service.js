
import ProfileService from "./profile.service.js";


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
		// 👉 insert needed info into new room object
		const room = {
			id: this.createUniqueId(),
			gameMode: message.gameMode,
			oppMode: message.oppMode,
			players: message.players
		};

		/* determine ID of real players and set accepted variable accordingly */
		for (let p of room.players) {
			if (p.ai != true) {
				const dbResult = await ProfileService.getIdByNick(p.nick);
				p.id = dbResult.userId;
				p.wsclient = await this.WebsocketService.getWsClientById(p.id);
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
		}
		// 👉 add accepted status to all players
		// 		👉accepted for OP, pending for players, accepted for AI opponent

		this.rooms.push(room);
		console.log("[RoomService] new room was created");

		/* printing rooms for debugging */
		console.debug(JSON.stringify(this.rooms, (key, value) => {
			if (key === "wsclient") return undefined; // Exclude wsclient
			return value;
		}, 2));
		
		return (room);
	// 👉 use setTimeout function with a promise to 
	// 	destroyRoom if fulfilled
	}

		/* 
	👉 async destroyRoom() {
		check if all players have accepted
		if not send message to all players informing them
		then destroy
		}
	 */


}

export default RoomService;