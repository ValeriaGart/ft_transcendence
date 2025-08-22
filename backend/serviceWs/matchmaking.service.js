import EmojiService from "./emoji.service.js";
import RoomService from "./room.service.js";
import InvitationService from "./invitation.service.js";
import RoomUtilsService from "./roomutils.service.js";
import RoomValidationService from "./roomvalidation.service.js";
import MatchService from "../services/match.service.js";
import { log, DEBUG, INFO, WARN, ERROR } from '../utils/logger.utils.js';

const timeoutSec = 30;

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

class MatchMakingService {
    constructor(websocketService) {
		log("[MatchMakingService constructor]", DEBUG);
		this.EmojiService = new EmojiService();
		this.WebsocketService = websocketService;
		this.RoomService = new RoomService(this.WebsocketService, this.EmojiService);
		this.RoomMax = 3;
    }

	createStartMatchMessage(room, playernumber) {
		const sanitizedPlayers = room.players.map(player => {
			const { wsclient, id, ...rest } = player; // Exclude wsclient
			return rest;
		});
		const message = {
			type: "STARTMATCH",
			sender: "__server",
			message: "Your match will start now.",
			roomId: room.id,
			urp: playernumber,
			players: sanitizedPlayers,
			gameMode: room.gameMode,
			oppMode: room.oppMode
		}
		return message;
	}

	
	createCancelMatchMessage(room) {
		const message = {
			type: "CANCELMATCH",
			sender: "__server",
			message: "This match was cancelled.",
			roomId: room.id
		}
		return message;
	}


	async startMatch(room) {
		for (let player of room.players) {
			if (player.id && player.wsclient) {
				// log("[startMatch] player: " + player.nick, DEBUG);
				await this.WebsocketService.sendMessageToClient(player.wsclient, this.createStartMatchMessage(room, player.pnumber));
			}
		}

	}
	

	async matchMakingInit(connection, message) {
		log("[matchMakingInit] start", DEBUG);
		if (this.RoomService.rooms.length >= this.RoomMax) {
			log("[matchMakingInit] Already too many rooms in progress, cancelling room creation", WARN);
			await this.WebsocketService.sendMessageToClient(connection, this.WebsocketService.createErrorMessage(`Already too many rooms in progress, please wait for a less busy time to play.`));
			return ;
		}
		if (RoomValidationService.roomValidation(message) === false) {
			log("[matchMakingInit] Room could not be validated", WARN);
			await this.WebsocketService.sendMessageToClient(connection, {
				type: "ERROR",
				sender: "__server",
				message: "Error creating Match: Room Validation failed"
			});
			return ;
		}

		if (this.RoomService.rooms.length > 0)
		{
			if (await RoomUtilsService.playersBusy(this.RoomService.rooms, message.players) === true) {
				log("[matchMakingInit] some of the players are busy, cancelling match", INFO);
				await this.WebsocketService.sendMessageToClient(connection, {
					type: "ERROR",
					sender: "__server",
					message: "Error creating Match: Players are busy"
				});
				return ;
			}
		}

		let roomStorage;

		try {
			const newRoom = await this.RoomService.createRoom(connection, message);
			roomStorage = newRoom;

		} catch (error) {
			log("Error: " + error.message, ERROR);

			await this.WebsocketService.sendMessageToClient(connection, {
				type: "ERROR",
				sender: "__server",
				message: "Something went wrong when creating the room."
			});
			return ;
		}


		try {
			const newRoom = roomStorage;
			await this.WebsocketService.sendMessageToClient(connection, {
				type: "INFO",
				sender: "__server",
				message: "Your room was created, waiting for players to accept the invitation.",
				roomId: `${newRoom.id}`
			});
			await InvitationService.sendInvitation(this.WebsocketService, newRoom);

			await InvitationService.allAcceptedPromiseHandler(newRoom, timeoutSec);

			await this.startMatch(newRoom);
		} catch (error) {
			log("Error: " + error.message, ERROR);

			await RoomUtilsService.sendMessageToAllPlayers(this.WebsocketService, roomStorage, this.createCancelMatchMessage(roomStorage));
			this.RoomService.destroyRoom(roomStorage.id);
			return ;
		}
	}
	
	
	async cancelMatch(connection, message) {
		log("[matchMakingService] cancelmatch", DEBUG);
		try {

			let room = await RoomUtilsService.roomExists(this.RoomService.rooms, message.roomId);
			if (!room) {
				throw new Error(`[cancelMatch] room with this id not found ${message.roomId}`);
			}
			if (! await RoomUtilsService.isPlayerInvited(room, connection)) {
				throw new Error(`[cancelMatch] player '${connection.userId}' is not a player in room ${message.roomId}`);
			}
			
			if (message.status === "cancel" || message.status === "cancelled") {
				await RoomUtilsService.sendMessageToAllPlayers(this.WebsocketService, room, this.createCancelMatchMessage(room));
				
			}
			else if (message.status === "finish" || message.status === "finished") {
				await RoomUtilsService.sendMessageToAllPlayers(this.WebsocketService, room, {message: "match was finished!"});
			}
			await this.RoomService.destroyRoom(room.id);
		} catch (error) {
			log(error.message, ERROR);
			await this.WebsocketService.sendMessageToClient(connection, {
				type: "ERROR",
				sender: "__server",
				message: "The match doesn't exist, or you are not a player in the match (5)."
			});

		}
		log(`[MatchMakingService] match was ${message.status}`, INFO);
	}
	
	async saveFinishMatch(connection, message) {
		log("[matchMakingService] saveFinishMatch", DEBUG);
		let room;
		try {

			room = await RoomUtilsService.roomExists(this.RoomService.rooms, message.roomId);
			if (!room) {
				throw new Error(`[saveFinishMatch] room with this id not found ${message.roomId}`);
			}
			if (! await RoomUtilsService.isPlayerInvited(room, connection)) {
				throw new Error(`[saveFinishMatch] player '${connection.userId}' is not a player in room ${message.roomId}`);
			}
			
		} catch (error) {
			log(error.message, ERROR);
			await this.WebsocketService.sendMessageToClient(connection, {
				type: "ERROR",
				sender: "__server",
				message: "The match doesn't exist, or you are not a player in the match (6)."
			});
			return ;
		}
		
		
		try {
			if (room.gameMode !== "bestof" || room.oppMode !== "online") {
				throw new Error ("[saveFinishMatch] gameMode or oppMode doesn't fit, room config does not allow for saving in database");
			}
			// save scores to database
			const [player1, player2] = room.players;
			
			const nicks = message.players.map(player => player.nick);
			const [p1_nick, p2_nick] = nicks;
			if (p1_nick !== player1.nick || p2_nick !== player2.nick) {
				log(`player1 room: ${player1.nick} message: ${p1_nick}\nplayer2 room: ${player2.nick} message: ${p2_nick}`, WARN);
				throw new Error ("[saveFinishMatch] player nicks don't match up with room data");
			}
				
				
			const scores = message.players.map(player => player.score);
			const [p1_score, p2_score] = scores;
			
			await MatchService.insertMatch(player1.wsclient.userId, player2.wsclient.userId, p1_score, p2_score, room.gameMode);
		
		} catch (error) {
			log(error.message, ERROR);
			await this.WebsocketService.sendMessageToClient(connection, {
				type: "ERROR",
				sender: "__server",
				message: "Something went wrong when saving the match, data was forfeit and match closed (6)."
			});
		}
		await RoomUtilsService.sendMessageToAllPlayers(this.WebsocketService, room, {message: "match was finished!"});
		
		await this.RoomService.destroyRoom(room.id);

	}

	async disconnectPlayerFromAllRooms(connection) {
		log("[matchMakingService] disconnectPlayerFromAllRooms", DEBUG);
		let rooms = this.RoomService.rooms;
		let deleteRooms = [];
		for (let r of rooms) {
			for (let p of r.players) {
				if (p.id === connection.userId && p.wsclient === connection) {
					log(`[disconnect] disconnected user ${p.id} from room ${r.id}, cancelling room`, INFO);
					deleteRooms.push(r);
				}
			}
		}
		for (let dr of deleteRooms) {
			await RoomUtilsService.sendMessageToAllPlayers(this.WebsocketService, dr, this.createCancelMatchMessage(dr));
			await this.RoomService.destroyRoom(dr.id);
		}
	}

	reconnectPlayerToAllRooms(connection) {
		log("[matchMakingService] reconnectPlayerToAllRooms", DEBUG);
		let rooms = this.RoomService.rooms;
		for (let r of rooms) {
			RoomUtilsService.reconnectPlayerToRoom(r, connection);
		}
	}


	async remoteMessageForwarding(roomId, gamestate, connection) {
		let room = RoomUtilsService.roomExists(this.RoomService.rooms, roomId);
		if (!room) {
			log("[MatchMakingService] remoteMessageForwarding: Room doesn't exist", WARN);
			return ;
		}
		await RoomUtilsService.sendMessageToAllPlayers(this.WebsocketService, room, gamestate, connection);
	}


}

export default MatchMakingService;