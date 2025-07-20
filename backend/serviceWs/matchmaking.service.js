import EmojiService from "./emoji.service.js";
import RoomService from "./room.service.js";
import InvitationService from "./invitation.service.js";
import RoomUtilsService from "./roomutils.service.js";

class MatchMakingService {
    constructor(websocketService) {
		this.rooms = [];
		this.EmojiService = new EmojiService();
		this.WebsocketService = websocketService;
		this.RoomService = new RoomService(this.WebsocketService, this.EmojiService);

		console.log("[MatchMakingService] constructor");
    }
	/* just information what room should contain
		{
		"gameMode": "1v1",
		"players": 
			[
				{
				"id": 1,
				"nick": "luca",
				"status": "accepted",
				"ai": false
				},
				{
					"id": 2,
					"nick": "yen",
					"status": "pending",
					"ai": false
				}
			],
		"timeoutAt": "timestamp + 30 seconds"
		}
	 */



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

	async startMatch(room) {
		/* checks for accepted status should NOT happen in here, but before */
		/* 👉 send info to all real players */
		for (let player of room.players) {
			if (player.id && player.wsclient) {
				console.log("[startMatch] player: ", player.nick);

				await this.WebsocketService.sendMessageToClient(player.wsclient, this.createStartMatchMessage(room));

				// await this.WebsocketService.sendMessageToClient(player.wsclient, {
				// 	sender: "__server",
				// 	message: `Your match will start now: ${room.id}`
				// })
			}
		}

	}
	



	async matchMakingInit(connection, message) {
		console.log("[matchMakingInit] start");
		if (this.RoomService.rooms.length > 0)
		{
		/* 👉👉👉👉 woopsie playersBusy needs to be rearranged so it can access the player IDs that are added in createRoom*/
			if (RoomUtilsService.playersBusy(this.RoomService.rooms, message.players) === true) {
				console.log("[matchMakingInit] some of the players are busy, cancelling match");
				this.WebsocketService.sendMessageToClient(connection, {
					type: "ERROR",
					sender: "__server",
					message: "Error creating Match: Players are busy"
				});
				// 👉	if someone already occupied, send FAILURE to connection
				// 	and exit the matchmaking
				return ;
			}
		}

		try {
			const newRoom = await this.RoomService.createRoom(connection, message);
			/*👉 send invitations to players 
				except connection (the one who invited) and AI opponents*/
			await InvitationService.sendInvitation(newRoom);



			/* 👉 send message to all players informing them that the match will start */
			this.startMatch(newRoom);
		} catch (error) {
			console.error("Error: ", error.message);
			//return error message to connection
			return ;
		}




		/* 
		Promise.race([matchInvitationTimeout, matchInvitationAccepted]).then((result) => {
			console.log(result);
			});
			*/

	}
	/* <><><><><><><><><><><><><><><><><><><><><><><><> */
}

export default MatchMakingService;