

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
				"nick": "luca",
				"status": "accepted"
				},
				{
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


	async matchMakingInit(connection, message) {
		if (this.rooms)
		{
			console.log("room exists :)");
			/*
			👉	iterate through all the rooms to confirm 
				that none of the requested players in message.players
				have ACCEPTED other rooms already
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