import EmojiService from "./emoji.service.js";

class MatchMakingService {
    constructor() {
		this.rooms = [];
		this.EmojiService = new EmojiService();
		console.log("matchmaking constructor");
    }
	/* just information what room should contain
		{
		"matchType": "1v1",
		"players": 
			[
				{
				"id": 1,
				"nick": "luca",
				"status": "accepted"
				},
				{
				"id": 2,
				"nick": "yen",
				"status": "pending"
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
			if (isUnique === true) {
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
			gameMode: message.matchType,
			players: message.players
		};
		// 	push it into this.rooms;
		this.rooms.push(room);
		console.log("room created");
		console.log(this.rooms);
		return (room);
	// 👉 use setTimeout function with a promise to 
	// 	destroyRoom if fulfilled
	}
	

	/* 
	👉 async destroyRoom() {
		check if all players have accepted
		if not send message to all players informing them
		then destroy
		}
	 */

	/* 
	👉 async matchMakingAcceptInvitation() {
		set status to accepted for player
		check if all accepted
			if yes, then startMatch()
		}
	*/

	/* 
	👉	async startMatch() {}
	*/

	getAllAcceptedPlayerIdsRoom(room) {
		const playerIdsRoom = [];
		for (let player of room.players) {
			if (player.accepted === true)
			{
				playerIdsRoom.push(player.id);
			}
		}
		return (playerIdsRoom);
	}

	playersBusy(players) {
		for (let room of this.rooms) {
			const playerIds = this.getAllAcceptedPlayerIdsRoom(room);
			for (let player of players) {
				if (playerIds.includes(player.id)) {
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
			if (this.playersBusy(message.players) === true) {
				console.log("[matchMakingInit] some of the players are busy, cancelling match");
				// 👉	if someone already occupied, send FAILURE to connection
				// 	and exit the matchmaking
				return ;
			}
		}

		try {
			const newRoom = await this.createRoom(connection, message);
		} catch (error) {
			console.error("Error: ", error.message);
			return ;
		}
		// (await newRoom).gameMode = "newmode";
		// console.log(this.rooms);
		// sendInvitation()

		/* 
		Promise.race([matchInvitationTimeout, matchInvitationAccepted]).then((result) => {
			console.log(result);
			});
			*/

		/*👉 send invitations to players 
			except connection (the one who invited) and AI opponents*/
	}
	/* <><><><><><><><><><><><><><><><><><><><><><><><> */
}

export default MatchMakingService;