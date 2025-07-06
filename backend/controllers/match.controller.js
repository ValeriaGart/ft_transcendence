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
			const match = await MatchService.getCurrentUserMatches();
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
}

export default MatchController;