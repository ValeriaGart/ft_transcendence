import WebsocketController from '../controllers/websocket.controller.js'

async function routes(fastify, options) {
	const controller = new WebsocketController(fastify.websocketServer);

	fastify.get('/hello-ws', { 
		websocket: true,
		preHandler: [fastify.authenticate]
		}, (connection, req) => {
		controller.handleConnection(connection);
	});
}


export default routes;