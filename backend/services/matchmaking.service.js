import EmojiService from "./emoji.service.js";
import WebsocketService from "./websocket.service.js";
import UserService from "./user.service.js";
import ProfileService from "./profile.service.js";

class MatchMakingService {
    constructor(websocketService) {
		this.rooms = [];
		this.EmojiService = new EmojiService();
		this.WebsocketService = websocketService;

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
		console.log("room created");
		console.log(JSON.stringify(this.rooms, (key, value) => {
			if (key === "wsclient") return undefined; // Exclude wsclient
			return value;
		}, 2));
		return (room);
	// 👉 use setTimeout function with a promise to 
	// 	destroyRoom if fulfilled
	}
	
	async sendInvitation() {
		return ;
	}

	/* 
	👉 async destroyRoom() {
		check if all players have accepted
		if not send message to all players informing them
		then destroy
		}
	 */

	
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
			text: "Your match will start now.",
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



	playersBusy(players) {
		for (let room of this.rooms) {
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
		if (this.rooms.length > 0)
		{
		/* 👉👉👉👉 woopsie playersBusy needs to be rearranged so it can access the player IDs that are added in createRoom*/
			if (this.playersBusy(message.players) === true) {
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
			const newRoom = await this.createRoom(connection, message);
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