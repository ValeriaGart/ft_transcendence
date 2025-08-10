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

	static async getAllMatchesByUserId(userId) {
		const matches = await dbAll(
			'SELECT * FROM match WHERE player1_id = ? OR player2_id = ? ORDER BY gameFinishedAt DESC, id DESC',
			[userId, userId]
		);
		return matches;
	}
 
	static async getMatchHistoryWithNicknames(userId) {
		// Ensure userId is an integer
		const userIdInt = parseInt(userId);
		
		const matches = await dbAll(
			`SELECT 
				m.id,
				m.type,
				m.player1_id,
				m.player2_id,
				m.winner_id,
				m.player1_score,
				m.player2_score,
				m.createdAt,
				m.gameFinishedAt,
				p1.nickname as player1_nickname,
				p2.nickname as player2_nickname
			FROM match m
			LEFT JOIN profiles p1 ON m.player1_id = p1.userId
			LEFT JOIN profiles p2 ON m.player2_id = p2.userId
			WHERE (m.player1_id = ? OR m.player2_id = ?) 
				AND m.gameFinishedAt IS NOT NULL
				AND m.type IN ('bestof', 'tournament')
			ORDER BY m.gameFinishedAt DESC, m.id DESC`,
			[userIdInt, userIdInt]
		);

		// Transform the data to the desired format
		return matches.map(match => {
			const isPlayer1 = match.player1_id === userIdInt;
			const opponentId = isPlayer1 ? match.player2_id : match.player1_id;
			const opponentNickname = isPlayer1 ? match.player2_nickname : match.player1_nickname;
			const playerScore = isPlayer1 ? match.player1_score : match.player2_score;
			const opponentScore = isPlayer1 ? match.player2_score : match.player1_score;
			const isWin = match.winner_id === userIdInt;

			return {
				id: match.id,
				date: match.gameFinishedAt,
				opponent: opponentNickname || `User${opponentId}`,
				playerScore,
				opponentScore,
				result: isWin ? 'Win' : 'Loss',
				matchType: match.type
			};
		});
	}

	static async getWinsLossesById(userId) {
		const stats = await dbGet(
			`SELECT 
				SUM(CASE WHEN winner_id = ? THEN 1 ELSE 0 END) as wins,
				SUM(CASE WHEN winner_id IS NOT NULL AND winner_id != ? THEN 1 ELSE 0 END) as losses
			 FROM match 
			 WHERE (player1_id = ? OR player2_id = ?) 
			 	AND gameFinishedAt IS NOT NULL
			 	AND type IN ('bestof', 'tournament')`,
			[userId, userId, userId, userId]
		);
		
		return {
			wins: stats.wins || 0,
			losses: stats.losses || 0
		};
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
		else if (win === "2") {
			winner_id = player2;
		}
		else {
			winner_id = null;
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