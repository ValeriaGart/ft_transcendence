import { resolve } from "path";
import RoomUtilsService from "./roomutils.service.js";
import { promise } from "bcrypt/promises.js";

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
class InvitationService {
	constructor(websocketService) {
		this.websocketService = websocketService;
		this.matchMakingService = websocketService.matchMakingService;
		this.roomService = this.matchMakingService.RoomService;
		console.log("[InvitationService] constructor");
	}

	static async createInvitationMessage(room) {
		const sanitizedPlayers = room.players.map(player => {
			const { wsclient, ...rest } = player; // Exclude wsclient
			return rest;
		});
		const message = {
			sender: "__server",
			message: "You were invited to this room.",
			roomId: room.id,
			players: sanitizedPlayers,
			gameMode: room.gameMode,
			oppMode: room.oppMode
		}
		return message;
	}

	static async sendInvitation(websocketService, room) {
		console.log("[InvitationService] sending invitations");

		const pendingPlayers = RoomUtilsService.getAllPendingPlayerNicksRoom(room);
		for (let p of room.players) {
			if ((await pendingPlayers).includes(p.nick)) {
				if (!p.wsclient) {
					console.log("[RoomUtilsService] can't send invitation to client without websocket connection");
					/* 👉 todo: throw error */
					break ;
				}
				websocketService.sendMessageToClient(p.wsclient, await this.createInvitationMessage(room));
			}
		}
		return ;
	}


	
	async matchMakingAcceptInvitation(connection, message) {
		console.log("[InvitationService] accept invitation");
		if (await RoomUtilsService.roomExists(this.roomService.rooms, message.roomId) == false) {
			console.log("[InvitationService] room doesn't exist");
			this.websocketService.sendMessageToClient(connection, this.websocketService.createErrorMessage(`The room you want to reply invitation to doesn't exist.`));
			return ;
		}
		else {
			console.log("[InvitationService] room exists");

		}
		// 👉 check if room exists by using message.roomId
			// if not, send err message to connection
			// if yes, save room from rooms[] for further use


		// 👉 check if in room.players the connection.userId is one of the players
			// if not, send err message to connection
			// if yes
				// 👉 set status to accepted for player
	}

	static async allAccepted(room) {
		for (let p of room.players) {
			if (p.accepted === "pending") {
				return (0) ;
			}
		}
		return (1);
	}

	//WIP
	static async allAcceptedPromiseHandler(room, timeoutSec) {
		let count = 0;
		const promiseAllAccepted = new Promise (async (resolve, reject) => {
			while (true) {
				await sleep (1000);
				count++;
				console.log(count)
				if (this.allAccepted(room) === 1) {
					resolve("[InvitationService] Promise 'All Players Accepted' resolved.");
				}
				if (count >= timeoutSec + 1) {
					reject("[InvitationService] Promise 'All Players Accepted' rejected after 31 seconds.")
				}
			}
		})
		return (promiseAllAccepted);
	}

}

export default InvitationService;