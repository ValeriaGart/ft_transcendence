import { dbRun, dbGet, dbAll } from "../config/database.js";

class MatchService {
	static async getAllMatches() {
		const match = await dbAll('SELECT * FROM match');
		return match;
	}

	// static async getAllMatchesType(matchtype) {
	// 	const match = await dbGet('SELECT * FROM match WHERE type = ?', [matchtype]);
	// 	return match;
	// }	
	
	static async getCurrentUserMatches(userId) {
		const match = await dbGet('SELECT * FROM match WHERE player1_id = ? or player2_id = ?', [userId, userId]);
		return match;
	}
	
	static async initiateMatch(player1, player2, matchtype) {
		const matchResult = await dbRun(
			'INSERT INTO match (player1_id, player2_id, type) VALUES (?, ?, ?)',
			[player1, player2, matchtype]
		);
		const matchID = matchResult.lastID;
		return matchID;
	}
}



export default MatchService;