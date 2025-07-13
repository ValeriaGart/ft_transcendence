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

	broadcast(message, excludeConnection = null) {
        for (let client of this.websocketServer.clients) {
			if (client.readyState === 1 && client !== excludeConnection) {
                client.send(JSON.stringify(message));
            }
        }
    }
}

export default WebsocketService;