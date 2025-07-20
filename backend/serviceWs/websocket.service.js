// import { dbGet } from "../config/database.js";
import FriendService from "../services/friend.service.js";
import MatchMakingService from "./matchmaking.service.js";

// const _matchMakingService = new MatchMakingService(this);

class WebsocketService {
    constructor(websocketServer) {
        this.websocketServer = websocketServer;
		// this.rooms = [];
		// this.matchMakingService = _matchMakingService;
		this.matchMakingService = new MatchMakingService(this);
    }

/* <><><><><><><><><><><><><><><><><><><><><><><><> */

	handleJoin(connection, wsid) {
		connection.userId = wsid;
		this.broadcast({
			type: "BROADCAST",
			sender: '__server',
			message: `id ${wsid} joined`
		}, connection);
	}

	handleLeave(connection) {
		connection.on('close', () => {
			this.broadcast({
				type: "BROADCAST",
				sender: '__server',
				message: `id ${connection.userId} left`
			});
		});
	}

	handleMessage(connection) {
		connection.on('message', message => {
			try {
				const parsedMessage = JSON.parse(message);

				// Validate required fields
				if (!parsedMessage.type || typeof parsedMessage.type !== 'number') {
					throw new Error ("Parsing: Invalid message: 'type' field is missing or not a number");
				}

				if (parsedMessage.type === 1) {
					console.log("[handleMessage] type 1: message")
					if (!parsedMessage.message) {
						throw new Error ("Parsing: Invalid message: 'message' field is missing or empty");
					}
					this.broadcast({
						type: "BROADCAST",
						sender: `${connection.userId}`,
						message: `${parsedMessage.message}`
					}, connection);
				}
				else if (parsedMessage.type === 2) {
					console.log("[handleMessage] type 2: online friend status");
					this.onlineFriends(connection);
				}
				else if (parsedMessage.type === 3) {
					console.log("[handleMessage] type 3: match invitation");
					if (!parsedMessage.players || !parsedMessage.gameMode || !parsedMessage.oppMode) {
						throw new Error ("Parsing: Invalid message: 'players', 'matchType' or 'oppMode' field is missing or empty");
					}
					this.matchMakingService.matchMakingInit(connection, parsedMessage);
				}
				else {
					console.log("[handleMessage] unknown type");
				}
			} catch (error) {
				console.error("Error occurring in WebsocketService: ", error.message);
				this.sendMessageToClient(connection, {
					type: "ERROR",
					sender: "__server",
					message: `Error occurring in WebsocketService: ${error.message}`
				});
			}
		});
	}



/* <><><><><><><><><><><><><><><><><><><><><><><><> */

	async onlineFriends(connection) {
		const onlineFriends = [];
		const friendslist = [];
		const friendIds = [];

		try {
			friendslist.push( await FriendService.getAllFriendshipsUserId(connection.userId));
		} catch (error) {
			console.error("DB ERROR: ", error.message);
		}
		
		const flatFriendslist = friendslist.flat();
		flatFriendslist.forEach(friend => {
			if (friend.initiator_id !== connection.userId) {
				friendIds.push(friend.initiator_id);
			}
			else {
				friendIds.push(friend.recipient_id);
			}
		});
		
		for (let client of this.websocketServer.clients) {
			if (client.readyState !== 1 || connection.userId === client.userId) {
				continue ;
			}
			if (friendIds.includes(client.userId)) {
				onlineFriends.push({
					userId: client.userId
				});
			}
		}
		connection.send(JSON.stringify({ onlineFriends }));
	}

/* <><><><><><><><><><><><><><><><><><><><><><><><> */

	async getWsClientById(id) {
		for (let client of this.websocketServer.clients) {
			if (client.userId === id) {
				return (client);
			}
		}
		return (null);
	}

	sendMessageToClient(client, message) {
		client.send(JSON.stringify(message));
		// for (let client of this.websocketServer.clients) {
		// 	if (client.readyState === 1 && client === deliverto) {
		// 	}
		// }

	}

	broadcast(message, excludeConnection = null) {
        for (let client of this.websocketServer.clients) {
			if (client.readyState === 1 && client !== excludeConnection) {
                client.send(JSON.stringify(message));
            }
        }
    }
}

export default WebsocketService;