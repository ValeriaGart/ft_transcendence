class RoomValidationService {

	static playersFieldCheck(players) {
		// checking if correct amount of people (2 or 4)
		if (players.length !== 2 && players.length !== 4) {
 		   throw new Error("[playersFieldCheck] Incorrect number of players. Must be 2 or 4.");
		}

		// checking if player.ai was sent at all
		const allAiExists = players.every(obj => 'ai' in obj);
		if (allAiExists === false) {
			throw new Error ("[playersFieldCheck] object is missing ai variable");
		}
		
		// checking if player.nick was sent at all
		const allNickExists = players.every(obj => 'nick' in obj);
		if (allNickExists === false) {
			throw new Error ("[playersFieldCheck] object is missing nick variable");
		}



		// checking if all player.nick are not empty
		const allNicks = players.every(obj => obj.nick !== "");
		if (allNicks === false) {
			throw new Error ("[playersFieldCheck] someone has empty nick");
		}
		
		// checking if all player.ai are not null
		const allAi = players.every(obj => obj.ai !== null);
		if (allAi === false) {
			// console.log("[playersFieldCheck] someone has empty nick");
			throw new Error ("[playersFieldCheck] someone has null AI info");
		}

		
		
		// check for duplicate nicks (including ai)
		
	}


	static roomValidation(message) {
		try {

			// check if none of the fields are empty or null
			
			if (this.playersFieldCheck(message.players) === false) {
				console.log("something went wrong");
				return ;
			}
			
			// check for valid gameMode
			
			
			// check for valid oppMode
		} catch (error) {
			console.log(error.message);
			return (false);
		}


		return (true);
	}
}

export default RoomValidationService;