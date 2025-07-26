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
			if (RoomUtilsService.playersBusy(this.RoomService.rooms, message.players) === true) {
				console.log("[matchMakingInit] some of the players are busy, cancelling match");
				this.WebsocketService.sendMessageToClient(connection, {
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
			this.WebsocketService.sendMessageToClient(connection, {
				type: "INFO",
				sender: "__server",
				message: "Your room was created, waiting for players to accept the invitation.",
				roomId: `${newRoom.id}`
			});
			await InvitationService.sendInvitation(this.WebsocketService, newRoom);

		//experiment
				// const promiseAllAccepted = new Promise(async (resolve, reject) => {
				// 	await sleep(5000); // 5 seconds
				// 	resolve("Promise 1 resolved after 5 seconds");
				// });
				const timeoutPromise = new Promise(async (resolve, reject) => {
					await sleep(timeoutSec * 1000); // 7 seconds
					resolve("Promise 2 resolved after 30 seconds");
				});
				

				Promise.race([await InvitationService.allAcceptedPromiseHandler(newRoom, timeoutSec), timeoutPromise]).then((result) => {
					console.log("promise race ended");
					console.log(result);
				});
					

			this.startMatch(newRoom);
		} catch (error) {
			console.error("Error: ", error.message);

			await RoomUtilsService.sendMessageToAllPlayers(this.WebsocketService, roomStorage, this.createCancelMatchMessage(roomStorage));
			this.RoomService.destroyRoom(roomStorage.id);
			return ;
		}
	}
}

export default MatchMakingService;