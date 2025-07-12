import WebsocketController from '../controllers/websocket.controller.js'

/* function broadcast(fastify, message) {
    for(let client of fastify.websocketServer.clients) {
        client.send(JSON.stringify(message));
    }
} */

	async function routes(fastify, options) {
	const controller = new WebsocketController(fastify.websocketServer);
	fastify.get('/hello-ws', { websocket: true }, (connection, req) => {
		controller.handleConnection(connection);
/* 		broadcast(fastify, {
			sender: '__server',
			message: `someone joined`
		});
		connection.on('close', () => {
			broadcast(fastify, {
				sender: '__server',
				message: `someone left`
			});
		});
		connection.on('message', message => {
			console.log(`Received message: ${message}`);
			connection.send('Hello Fastify WebSockets');
		}); */
	});
}


export default routes;