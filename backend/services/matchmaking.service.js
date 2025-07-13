

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


		
	/*👉 async createRoom() {
		insert needed info into new room object
		push it into this.rooms;
	}
	*/



	async matchMakingInvitation(connection, message) {
		if (this.rooms)
		{
			/*👉	iterate through all the rooms to confirm 
				that none of the requested players in message.players
				have ACCEPTED other rooms already*/
			// for (let room of this.rooms) {
			// 	if 
			// }
		}

		/*👉 createRoom(); */

		/*👉 send invitations to players 
			except connection (the one who invited) and AI opponents*/

		
	}
	/* <><><><><><><><><><><><><><><><><><><><><><><><> */
}

export default MatchMakingService;