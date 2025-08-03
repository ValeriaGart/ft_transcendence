class RoomUtilsService {
	static async getAllAcceptedPlayerNicksRoom(room) {
		const playerNicksRoom = [];
		for (let player of room.players) {
			if (player.ai == false && player.accepted === "accepted")
				{
					playerNicksRoom.push(player.nick);
				}
		}
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
				if (player.ai === true) {
					continue ;
				}
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
			if (p.id == connection.userId) {
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

	static async sendMessageToAllPlayers(websocketService, room, message) {
		for (let p of room.players) {
			if (p.ai == true) {
				continue ;
			}
			if (p.accepted != "declined") {
				await websocketService.sendMessageToClient(p.wsclient, message);
			}
		}
	}


	// this method updates the wsclient inside the room.players array after user has reconnected
	static reconnectPlayerToRoom(room, connection) {
		for (let p of room.players) {
			if (p.id === connection.userId) {
				p.wsclient = connection;
				console.log(`[reconnect] reconnected user ${p.id} to room ${room.id}`);
				break ;
			}
		}
	}


}

export default RoomUtilsService;
