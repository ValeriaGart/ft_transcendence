import RoomUtilsService from "./roomutils.service.js";
import sleep from "../utils/sleep.utils.js";
import { log } from '../utils/logger.utils.js';

class InvitationService {
	constructor(websocketService) {
		this.websocketService = websocketService;
		this.matchMakingService = websocketService.matchMakingService;
		this.roomService = this.matchMakingService.RoomService;
		log("[InvitationService] constructor");
		
	}

	static async createInvitationMessage(room) {
		const sanitizedPlayers = room.players.map(player => {
			const { wsclient, ...rest } = player; // Exclude wsclient
			return rest;
		});
		const message = {
			type: "INVITATION",
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
					throw new Error ("[RoomUtilsService] can't send invitation to client without websocket connection");
				}
				await websocketService.sendMessageToClient(p.wsclient, await this.createInvitationMessage(room));
			}
		}
		return ;
	}


	
	async matchMakingAcceptInvitation(connection, message) {
		console.log("[InvitationService] accept invitation");
		let room = await RoomUtilsService.roomExists(this.roomService.rooms, message.roomId);
		if (!room) {
			console.log("[InvitationService] room doesn't exist");
			await this.websocketService.sendMessageToClient(connection, this.websocketService.createErrorMessage(`The room you want to reply invitation to doesn't exist.`));
			return ;
		}
		else {
			console.log("[InvitationService] room exists");
		}
		
 		let areUEvenInvitedBro = await RoomUtilsService.isPlayerInvited(room, connection);
		if (areUEvenInvitedBro === false) {
			console.log("[InvitationService] bro wasn't even invited");
			await this.websocketService.sendMessageToClient(connection, this.websocketService.createErrorMessage(`The room you want to reply invitation to did not invite you.`));
			return ;
		}
		else {
			console.log("[InvitationService] bro was invited");
		}

		RoomUtilsService.setPlayerAcceptance(room, connection.userId, message.acceptance);
		console.log(`userId ${connection.userId} replied this to invitation: ${message.acceptance}.`);
	}

	static async allAccepted(room) {
		for (let p of room.players) {
			if (p.accepted === "pending") {
				return (0) ;
			}
			if (p.accepted === "declined") {
				return (-1) ;
			}
		}
		return (1);
	}


	static async allAcceptedPromiseHandler(room, timeoutSec) {
		let count = 0;
		const promiseAllAccepted = new Promise (async (resolve, reject) => {
			while (true) {
				await sleep (1000);
				count++;
				// console.log(count) // 👉👉👉👉👉👉👉👉👉👉👉👉👉 dont forget
				let ret = await this.allAccepted(room);
				if (ret === 1) {
					resolve("[InvitationService] Promise 'All Players Accepted' resolved.");
					break ;
				}
				if (ret === -1) {
					reject(new Error ("[InvitationService] Promise 'All Players Accepted' rejected, invitation declined."));
					break ;
				}
				if (count >= timeoutSec) {
					reject(new Error ("[InvitationService] Promise 'All Players Accepted' rejected after 30 seconds."))
					break ;
				}

			}
		});
		return (promiseAllAccepted);
	}

}

export default InvitationService;