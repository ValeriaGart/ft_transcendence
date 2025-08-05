let validGameModes = ["bestof", "infinite"];
let validOppModes = ["single", "online"];

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
			throw new Error ("[playersFieldCheck] someone has null AI info");
		}
		
		// check for duplicate nicks (including ai)
		let nicks = [];
		for (let p of players) {
			if (nicks.includes(p.nick)) {
				throw new Error ("[playersFieldCheck] duplicate nick was sent");
			}
			nicks.push(p.nick);
		}
	}

	static gameModeFieldCheck(gameMode) {
		if (!gameMode || gameMode === "") {
			throw new Error ("[gameModeFieldCheck] field is empty");
		}

		if (!validGameModes.includes(gameMode)) {
			throw new Error ("[gameModeFieldCheck] invalid game mode");
		}
	}
	
	static oppModeFieldCheck(oppMode) {
		if (!oppMode || oppMode === "") {
			throw new Error ("[oppModeFieldCheck] field is empty");
		}

		if (!validOppModes.includes(oppMode)) {
			throw new Error ("[oppModeFieldCheck] invalid opponent mode");
		}
	}

	static roomValidation(message) {
		try {
			// check for valid players array
			this.playersFieldCheck(message.players);
			
			// check for valid gameMode
			this.gameModeFieldCheck(message.gameMode);
			
			// check for valid oppMode
			this.oppModeFieldCheck(message.oppMode);

		} catch (error) {
			console.log(error.message);
			return (false);
		}


		return (true);
	}
}

export default RoomValidationService;