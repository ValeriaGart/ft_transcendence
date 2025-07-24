class RoomUtilsService {
	static async getAllAcceptedPlayerNicksRoom(room) {
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
	
	static async getAllPendingPlayerNicksRoom(room) {
		const playerNicksRoom = [];
		for (let player of room.players) {
			if (player.ai == false && player.accepted === "pending")
				{
					playerNicksRoom.push(player.nick);
				}
		}
		return (playerNicksRoom);
	}



	static async playersBusy(rooms, players) {
		for (let room of rooms) {
			const playerNicks = await this.getAllAcceptedPlayerNicksRoom(room);
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


	static async roomExists(rooms, roomId) {
		for (let r of rooms) {
			if (r.id == roomId) {
				return (r);
			}
		}
		return (null);
	}

	static async isPlayerInvited(room, connection) {
		let areUEvenInvitedBro = false;
		for (let p of room.players) {
			if (p.ai == true) {
				continue ;
			}
			if (p.wsclient.userId == connection.userId) {
				areUEvenInvitedBro = true;
				break;
			}
		}
		return (areUEvenInvitedBro);
	}

	static async setPlayerAcceptance(room, playerId, acceptance) {

		for (let p of room.players) {
			if (p.wsclient.userId === playerId) {
				if (acceptance == "accept" || acceptance == "accepted" || acceptance == "accepts") {
					p.accepted = "accepted";
				}
				else {
					p.accepted = "declined";
				}
			}
		}
	}



}

export default RoomUtilsService;
