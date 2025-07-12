class WebsocketService {
    constructor(websocketServer) {
        this.websocketServer = websocketServer;
    }

/* <><><><><><><><><><><><><><><><><><><><><><><><> */
/* <><><><><><><><><><><><><><><><><><><><><><><><> */
/* <><><><><><><><><><><><><><><><><><><><><><><><> */

	handleJoin(connection) {
		this.broadcast({
			sender: '__server',
			message: 'someone joined'
		}, connection);
	}

	handleLeave(connection) {
		connection.on('close', () => {
			this.broadcast({
				sender: '__server',
				message: `someone left`
			});
		});
	}

	handleMessage(connection) {
		connection.on('message', message => {
			console.log(`Received message: ${message}`);
			connection.send('Hello Fastify WebSockets');
		});
	}

	broadcast(message, excludeConnection = null) {
        for (let client of this.websocketServer.clients) {
            if (client.readyState === 1 && client !== excludeConnection) { // Ensure the client is open
                client.send(JSON.stringify(message));
            }
        }
    }
}

export default WebsocketService;