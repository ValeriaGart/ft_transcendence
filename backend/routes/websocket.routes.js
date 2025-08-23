import WebsocketController from '../controllers/websocket.controller.js'

async function routes(fastify, options) {
	const controller = new WebsocketController(fastify.websocketServer);

	fastify.get('/hello-ws', { 
		websocket: true,
		preHandler: [fastify.authenticate]
		}, (connection, req) => {
		const wsid = req.user.userId;
		const sessionId = req.user.sessionId;
		controller.handleConnection(connection, req, wsid, sessionId);
	});
}


export default routes;