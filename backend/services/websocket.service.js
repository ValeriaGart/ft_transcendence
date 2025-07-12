import { dbGet } from "../config/database.js";
import FriendService from "./friend.service.js";

class WebsocketService {
    constructor(websocketServer) {
        this.websocketServer = websocketServer;
    }

/* <><><><><><><><><><><><><><><><><><><><><><><><> */

	handleJoin(connection, wsid) {
		connection.userId = wsid;
		this.broadcast({
			sender: '__server',
			message: `id ${wsid} joined`
		}, connection);
	}

	handleLeave(connection) {
		connection.on('close', () => {
			this.broadcast({
				sender: '__server',
				message: `id ${connection.userId} left`
			});
		});
	}

	handleMessage(connection) {
		connection.on('message', message => {
			try {
				const parsedMessage = JSON.parse(message);
				
				// console.log(`Received message: ${message}`);
				// console.log(`Received json: ${parsedMessage.type}`);

				if (parsedMessage.type === 1) {
					console.log("[handleMessage] type 1")
					this.broadcast({
						sender: `${connection.userId}`,
						message: `${parsedMessage.message}`
					}, connection);
				}
				else if (parsedMessage.type === 2) {
					console.log("[handleMessage] type 2");
					this.onlineFriends(connection);
				}
				else {
					console.log("[handleMessage] unknown type");
				}
			} catch (error) {
				console.error("Failed to parse message: ", error.message);
			}
		});
	}

/* <><><><><><><><><><><><><><><><><><><><><><><><> */

	async onlineFriends(connection) {
		const onlineFriends = [];
		for (let client of this.websocketServer.clients) {
			if (connection.userId === client.userId) {
				continue ;
			}
			try {
				const friend = await FriendService.getFriendshipStatus(connection.userId, client.userId);
				if (friend === 1) {
					// add to list of friends who are online
					onlineFriends.push({
						userId: client.userId
					});
					// console.log("1)", connection.userId, " ", client.userId, " are friends ", friend);
				}
				// console.log("2)", connection.userId, " ", client.userId, friend);
			} catch (error) {
				console.log("db error probably: ", error.message);
			}
			// console.log("3)", connection.userId, " ", client.userId, onlineFriends);
		}
		connection.send(JSON.stringify({ onlineFriends }));
	}

	broadcast(message, excludeConnection = null) {
        for (let client of this.websocketServer.clients) {
			if (client.readyState === 1 && client !== excludeConnection) {
				console.log("client ", client.userId);
                client.send(JSON.stringify(message));
            }
        }
    }
}

export default WebsocketService;