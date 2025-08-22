import { db } from "../config/database.js"

export default function handleSignals(app, log) {

	async function shutdown(signal) {
		log(`Received ${signal}. Shutting down gracefully...`, "info");
		try {
			await app.close();
			await db.close();
			log("Fastify server closed.", "info");
			// process.exit(0);
		} catch (err) {
			console.log("Error during shutdown: " + err, "error");
			process.exit(1);
		}
	}
	process.on('SIGINT', () => shutdown('SIGINT'));
	process.on('SIGTERM', () => shutdown('SIGTERM'));
}
