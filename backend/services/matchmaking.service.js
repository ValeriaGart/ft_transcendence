import EmojiService from "./emoji.service.js";
import WebsocketService from "./websocket.service.js";
import UserService from "./user.service.js";
import ProfileService from "./profile.service.js";
import RoomService from "./room.service.js";

class MatchMakingService {
    constructor(websocketService) {
		this.rooms = [];
		this.EmojiService = new EmojiService();
		this.WebsocketService = websocketService;
		this.RoomService = new RoomService(this.WebsocketService, this.EmojiService);

		console.log("matchmaking constructor");
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


	
	async sendInvitation() {
		return ;
	}


	
	async matchMakingAcceptInvitation() {
		//👉 set status to accepted for player
		//👉 check if all accepted
		// 👉	if yes, then startMatch()
		// }
	}

	createStartMatchMessage(room) {
		const sanitizedPlayers = room.players.map(player => {
			const { wsclient, ...rest } = player; // Exclude wsclient
			return rest;
		});
		const message = {
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
	

	getAllAcceptedPlayerNicksRoom(room) {
		const playerNicksRoom = [];
		for (let player of room.players) {
			// console.log("[getAllAcceptedPlayerNicksRoom] player: ", player.nick);
			if (player.ai == false && player.accepted === "accepted")
				{
					playerNicksRoom.push(player.nick);
				}
		}
		// console.log("[getAllAcceptedPlayerNicksRoom] playerNicksRoom: ", playerNicksRoom);
		return (playerNicksRoom);
	}



	playersBusy(rooms, players) {
		for (let room of rooms) {
			const playerNicks = this.getAllAcceptedPlayerNicksRoom(room);
			// console.log("[playersBusy] accepted playerNicks: ", playerNicks);
			for (let player of players) {
				//👉 if (player.id === aiPlayer)
				//	continue ;
				console.log("[playersBusy] checking player: ", player.nick);
				if (playerNicks.includes(player.nick)) {
					console.log("someone is busy: ", player.nick);
					return true; // Player is busy
				}
			}
		}
		return false; // No players are busy
	}

	async matchMakingInit(connection, message) {
		console.log("[matchMakingInit] start");
		if (this.RoomService.rooms.length > 0)
		{
		/* 👉👉👉👉 woopsie playersBusy needs to be rearranged so it can access the player IDs that are added in createRoom*/
			if (this.playersBusy(this.RoomService.rooms, message.players) === true) {
				console.log("[matchMakingInit] some of the players are busy, cancelling match");
				this.WebsocketService.sendMessageToClient(connection, {
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
			await this.sendInvitation()



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