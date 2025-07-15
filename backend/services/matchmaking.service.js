class MatchMakingService {
    constructor() {
		this.rooms = [];
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


		
	/*
	👉 async createRoom() {
		insert needed info into new room object
		push it into this.rooms;
	👉 use setTimeout function with a promise to 
		destroyRoom if fulfilled
	}
	*/

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
		if (this.rooms)
		{
			console.log("room exists :)");
			if (playersBusy(message.players) === true) {
				console.log("[matchMakingInit] some of the players are busy, cancelling match");
				//👉 cancel match invitation
				return ;
			}
			/*
			👉	if someone already occupied, send FAILURE to connection
				and exit the matchmaking
			*/
			
			// for (let room of this.rooms) {
			// 	if 
			// }
		}

		/*👉 createRoom(); */

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