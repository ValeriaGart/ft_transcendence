import RoomUtilsService from "./roomutils.service.js";

class InvitationService {

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


	
	static async matchMakingAcceptInvitation() {
		//👉 set status to accepted for player
		//👉 check if all accepted
		// 👉	if yes, then startMatch()
		// }
	}

}

export default InvitationService;