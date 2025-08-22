import { OrganizeImportsMode } from "typescript";
import ProfileService from "../services/profile.service.js";
import { log, DEBUG, INFO, WARN, ERROR } from '../utils/logger.utils.js';


class RoomService {
	constructor(websocketService, emojiService) {
		log("[RoomService constructor]", DEBUG);
		this.rooms = [];
		this.WebsocketService = websocketService;
		this.EmojiService = emojiService;

	}


		createUniqueId() {
		log("[RoomService] createUniqueId", DEBUG);
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
					log("duplicate, renewing id", WARN);
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
		log("[RoomService] createRoom", DEBUG);
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
		log("[RoomService] new room was created", INFO);

		/* printing rooms for debugging */
		log(JSON.stringify(this.rooms, (key, value) => {
			if (key === "wsclient") return undefined; // Exclude wsclient
			return value;
		}, 2), DEBUG);
		
		return (room);
	}

		
	async destroyRoom(todeleteId) {
		let count = 0;
		let og_roomlen = this.rooms.length;
		// log("[RoomService] rooms[] length: " + og_roomlen, DEBUG);

		for (let r of this.rooms) {
			if (r.id === todeleteId) {
				log("deleting room: " + todeleteId, DEBUG);
				this.rooms.splice(count, 1);
				continue ;
			}
			count++;
		}

		if (this.rooms.length != og_roomlen) {
			log("[RoomService] destroyRoom deleted " + (og_roomlen - this.rooms.length) + " room", DEBUG);
		}
		else {
			log("[RoomService] destroyRoom did not delete any rooms", WARN);
		}
	}
}

export default RoomService;