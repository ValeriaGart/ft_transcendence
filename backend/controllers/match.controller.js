import MatchService from '../services/match.service.js'
import { log, DEBUG, INFO, WARN, ERROR } from '../utils/logger.utils.js';

class MatchController {
	static async getAllMatches(request, reply) {
		try {
			const match = await MatchService.getAllMatches();
			return match;
		} catch (error) {
			reply.code(500);
			return { error: 'Failed to retrieve matches', details: error.message };
		}
	}

	// static async getAllMatchesType(request, reply) {
	// 	try {
	// 		const matchtype = request.match.matchtype;
	// 		const match = await MatchService.getAllMatchesType(matchtype);
	// 		if (!match) {
	// 			reply.code(404);
	// 			return { error: 'No matches of this type found' };
	// 		}
	// 		return match;
	// 	} catch (error) {
	// 		reply.code(500);
	// 		return { error: 'Failed to retrieve matches (type)', details: error.message };
	// 	}
	// }
	
	
	static async getCurrentUserMatches(request, reply) {
		try {
			// log('Request Body:' + request.user.userId); // Log the request body
			const match = await MatchService.getCurrentUserMatches(request.user.userId);
			if (!match) {
				reply.code(404);
				return { error: 'No matches for this user found' };
			}
			return match;
		} catch (error) {
			reply.code(500);
			return { error: 'Failed to retrieve matches for this user', details: error.message };
		}
	}

	static async getAllMatchesByUserId(request, reply) {
		try {
			const { id } = request.params;
			const matches = await MatchService.getAllMatchesByUserId(id);
			
			if (!matches || matches.length === 0) {
				return { matches: [], message: 'No matches found for this user' };
			}
			
			return { matches, total: matches.length };
		} catch (error) {
			reply.code(500);
			return { error: 'Failed to retrieve matches for user', details: error.message };
		}
	}

	static async getMatchHistoryWithNicknames(request, reply) {
		try {
			const { id } = request.params;
			log('Received ID param:' + id + ' Type:' + typeof id, DEBUG); // Debug log
			const matchHistory = await MatchService.getMatchHistoryWithNicknames(id);
			log('Service returned:' + matchHistory.length + ' matches', DEBUG); // Debug log
			
			return {
				userId: parseInt(id),
				matches: matchHistory,
				total: matchHistory.length
			};
		} catch (error) {
			log('Controller error:' + error, DEBUG); // Debug log
			reply.code(500);
			return { error: 'Failed to retrieve match history', details: error.message };
		}
	}

	static async getCurrentUserMatchHistory(request, reply) {
		try {
			const userId = request.user.userId;
			const matchHistory = await MatchService.getMatchHistoryWithNicknames(userId);
			
			return {
				userId,
				matches: matchHistory,
				total: matchHistory.length
			};
		} catch (error) {
			reply.code(500);
			return { error: 'Failed to retrieve match history', details: error.message };
		}
	}

	static async getWinsLossesById(request, reply) {
		try {
			const { id } = request.params;
			const stats = await MatchService.getWinsLossesById(id);
			
			return {
				userId: parseInt(id),
				wins: stats.wins,
				losses: stats.losses,
				total: stats.wins + stats.losses
			};
		} catch (error) {
			reply.code(500);
			return { error: 'Failed to retrieve win/loss statistics', details: error.message };
		}
	}
	
	static async initiateMatch(request, reply) {
		try {
			// log('Request Body:' + request.body, DEBUG); // Log the request body
			const { player1, player2, matchtype } = request.body; // Correctly access the body
			const match = await MatchService.initiateMatch(player1, player2, matchtype);
			return match;
		} catch (error) {
			reply.code(500);
			return { error: 'Failed to initiate match', details: error.message };
		}
	}

	static async finishMatch(request, reply) {
		try {
			// log('Request Body:' + request.body, DEBUG); // Log the request body
			const { player1_score, player2_score, match_id } = request.body; // Correctly access the body
			const match = await MatchService.finishMatch(player1_score, player2_score, match_id);
			return match;
		} catch (error) {
			reply.code(500);
			return { error: 'Failed to finish match', details: error.message };
		}
	}
	
	static async deleteMatch(request, reply) {
		try {
			// log('Request Body:' + request.body, DEBUG); // Log the request body
			const { id } = request.params; // Correctly access the body
			const match = await MatchService.deleteMatch(id);
			return match;
		} catch (error) {
			reply.code(500);
			return { error: 'Failed to delete match', details: error.message };
		}
	}
	

}

export default MatchController;