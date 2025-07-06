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
}

export default MatchController;