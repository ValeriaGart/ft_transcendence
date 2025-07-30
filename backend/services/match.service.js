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
		const match = await dbAll('SELECT * FROM match WHERE player1_id = ? or player2_id = ?', [userId, userId]);
		return match;
	}
	
	static async initiateMatch(player1, player2, matchtype) {
		if (player1 === player2)
		{
			throw new Error ("Can't match against yourself...");
		}
		const matchResult = await dbRun(
			'INSERT INTO match (player1_id, player2_id, type) VALUES (?, ?, ?)',
			[player1, player2, matchtype]
		);
		const matchID = matchResult.lastID;
		return matchID;
	}

	static async finishMatch(player1_score, player2_score, match_id) {
		const gameFinishedAlready = await dbGet('SELECT * FROM match WHERE id = ?', [match_id]);
		if (!gameFinishedAlready){
			throw new Error ('Match not found');
		}
		if (gameFinishedAlready.gameFinishedAt) {
			throw new Error ('Match already finished');
		}
		const win = player1_score > player2_score ? "1" : player1_score === player2_score ? "0" : "2";
		const matchResult = await dbRun(
			'UPDATE match \
			SET player1_score = ?, player2_score = ?, \
			winner_id = CASE \
				WHEN ? = "1" THEN player1_id	\
				WHEN ? = "2" THEN player2_id \
				ELSE NULL \
			END, \
			gameFinishedAt = CURRENT_TIMESTAMP \
			WHERE id = ?',
			[player1_score, player2_score, win, win, match_id]
		);
		return match_id;
	}

	static async insertMatch(player1, player2, player1_score, player2_score, matchtype) {
		if (player1 === player2)
		{
			throw new Error ("Can't match against yourself...");
		}
		const win = player1_score > player2_score ? "1" : player1_score === player2_score ? "0" : "2";
		let winner_id;
		if (win === "1") {
			winner_id = player1;
		}
		else {
			winner_id = player2;
		}

		const matchResult = await dbRun(
			'INSERT INTO match (player1_id, player2_id, player1_score, player2_score, type, gameFinishedAt, winner_id) \
			VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?)',
			[player1, player2, player1_score, player2_score, matchtype, winner_id]
		);
		const matchID = matchResult.lastID;
		return matchID;
	}

	
	static async deleteMatch(match_id) {
		const matchResult = await dbRun(
			'DELETE FROM match WHERE id = ?',
			[match_id]
		);
		if (matchResult.changes === 0){
			throw new Error ('Match ID doesn\'t exist');
		}
		return matchResult.changes;
	}
}


export default MatchService;