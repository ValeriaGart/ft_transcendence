import MatchService from '../services/match.service.js'

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
			// console.log('Request Body:', request.user.userId); // Log the request body
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
	
	static async initiateMatch(request, reply) {
		try {
			// console.log('Request Body:', request.body); // Log the request body
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
			// console.log('Request Body:', request.body); // Log the request body
			const { player1_score, player2_score, match_id } = request.body; // Correctly access the body
			const match = await MatchService.finishMatch(player1_score, player2_score, match_id);
			return match;
		} catch (error) {
			reply.code(500);
			return { error: 'Failed to finish match', details: error.message };
		}
	}

	

}

export default MatchController;