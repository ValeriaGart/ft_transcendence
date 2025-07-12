class WebsocketService {
    constructor(websocketServer) {
        this.websocketServer = websocketServer;
    }

/* <><><><><><><><><><><><><><><><><><><><><><><><> */

	handleJoin(connection, wsid) {
		this.broadcast({
			sender: '__server',
			message: `id ${wsid} joined`
		}, connection);
	}

	handleLeave(connection, wsid) {
		connection.on('close', () => {
			this.broadcast({
				sender: '__server',
				message: `id ${wsid} left`
			});
		});
	}

	handleMessage(connection, wsid) {
		connection.on('message', message => {
			try {
				const parsedMessage = JSON.parse(message);
				
				// console.log(`Received message: ${message}`);
				// console.log(`Received json: ${parsedMessage.type}`);

				if (parsedMessage.type === 1) {
					console.log("[handleMessage] type 1")
					this.broadcast({
						sender: `${wsid}`,
						message: `${parsedMessage.message}`
					}, connection);
				}
				else if (parsedMessage.type === 2) {
					console.log("[handleMessage] type 2");
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

	broadcast(message, excludeConnection = null) {
        for (let client of this.websocketServer.clients) {
            if (client.readyState === 1 && client !== excludeConnection) {
                client.send(JSON.stringify(message));
            }
        }
    }
}

export default WebsocketService;