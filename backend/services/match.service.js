import { dbRun, dbGet, dbAll } from "../config/database.js";

class MatchService {
	static async getAllMatches() {
		const match = await dbAll('SELECT * FROM match');
		return match;
	}	
}

export default MatchService;