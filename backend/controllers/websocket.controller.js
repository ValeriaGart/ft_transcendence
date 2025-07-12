import WebsocketService  from "../services/websocket.service.js";

class WebsocketController {
    constructor(websocketServer) {
        this.service = new WebsocketService(websocketServer);
    }

	handleConnection(connection, req, wsid) {
		// connection.userId = req.userId;
		this.service.handleJoin(connection, wsid);
		this.service.handleLeave(connection, wsid);
		this.service.handleMessage(connection, wsid);

		try {

			console.log("[WebsocketController] handle connection ", wsid );
		} catch (error) {
			console.log("error");
		}
	}
}

export default WebsocketController;