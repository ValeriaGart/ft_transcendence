import WebsocketService  from "../services/websocket.service.js";

class WebsocketController {
    constructor(websocketServer) {
        this.service = new WebsocketService(websocketServer);
    }

	handleConnection(connection) {
		this.service.handleJoin(connection);
		this.service.handleLeave(connection);
		this.service.handleMessage(connection);

		try {

			console.log("[WebsocketController] handle connection");
		} catch (error) {
			console.log("error");
		}
	}
}

export default WebsocketController;