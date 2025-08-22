import WebsocketService  from "../serviceWs/websocket.service.js";
import { log, DEBUG, INFO, WARN, ERROR } from '../utils/logger.utils.js';

class WebsocketController {
    constructor(websocketServer) {
		log("[WebsocketController constructor]", DEBUG);
        this.service = new WebsocketService(websocketServer);
		
    }

	handleConnection(connection, req, wsid) {

		this.service.handleJoin(connection, wsid);
		this.service.handleLeave(connection);
		this.service.handleMessage(connection);
	}
}

export default WebsocketController;