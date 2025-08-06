import WebsocketService  from "../serviceWs/websocket.service.js";

class WebsocketController {
    constructor(websocketServer) {
        this.service = new WebsocketService(websocketServer);
    }

	handleConnection(connection, req, wsid) {

		this.service.handleJoin(connection, wsid);
		this.service.handleLeave(connection);
		this.service.handleMessage(connection);
	}
}

export default WebsocketController;