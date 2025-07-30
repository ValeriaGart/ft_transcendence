import EmojiService from "./emoji.service.js";
import RoomService from "./room.service.js";
import InvitationService from "./invitation.service.js";
import RoomUtilsService from "./roomutils.service.js";

const timeoutSec = 30;

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

class MatchMakingService {
    constructor(websocketService) {
		this.EmojiService = new EmojiService();
		this.WebsocketService = websocketService;
		this.RoomService = new RoomService(this.WebsocketService, this.EmojiService);
		
		console.log("[MatchMakingService] constructor");
    }

	createStartMatchMessage(room) {
		const sanitizedPlayers = room.players.map(player => {
			const { wsclient, ...rest } = player; // Exclude wsclient
			return rest;
		});
		const message = {
			type: "STARTMATCH",
			sender: "__server",
			message: "Your match will start now.",
			roomId: room.id,
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
				console.log("[startMatch] player: ", player.nick);
				await this.WebsocketService.sendMessageToClient(player.wsclient, this.createStartMatchMessage(room));
			}
		}

	}
	

	async matchMakingInit(connection, message) {
		console.log("[matchMakingInit] start");
		if (this.RoomService.rooms.length > 0)
		{
			if (await RoomUtilsService.playersBusy(this.RoomService.rooms, message.players) === true) {
				console.log("[matchMakingInit] some of the players are busy, cancelling match");
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
			console.error("Error: ", error.message);

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
			console.error("Error: ", error.message);

			await RoomUtilsService.sendMessageToAllPlayers(this.WebsocketService, roomStorage, this.createCancelMatchMessage(roomStorage));
			this.RoomService.destroyRoom(roomStorage.id);
			return ;
		}
	}
	
	
	async cancelMatch(connection, message) {
		const room = RoomUtilsService.roomExists(this.RoomService.rooms, message.roomId);
		if (!room) {
			throw new Error(`[cancelMatch] room with this id not found ${message.roomId}`);
		}
		if (!RoomUtilsService.isPlayerInvited(room, connection)) {
			throw new Error(`[cancelMatch] player '${connection.userId}' is not a player in room ${message.roomId}`);
		}

		if (message.status === "cancel" || message.status === "cancelled") {
			await RoomUtilsService.sendMessageToAllPlayers(this.WebsocketService, room, this.createCancelMatchMessage(room));
			
		}
		else if (message.status === "finish" || message.status === "finished") {
			// is this needed? won't all players know anyways when the match is finished?
		}
		this.RoomService.destroyRoom(room.id);
	}

	async saveFinishMatch(connection, message) {

	}
}

export default MatchMakingService;