import MatchController from '../controllers/match.controller.js';
import {
	// matchParamsSchema
	matchStartSchema,
	matchFinishSchema
} from '../schemas/match.schemas.js';

async function routes(fastify, options) {
	fastify.get('/match', MatchController.getAllMatches);

	fastify.get('/match/me', {
		preHandler: [fastify.authenticate]
	} , MatchController.getCurrentUserMatches);

	fastify.post('/match/startgame', {
		schema: {
			body: matchStartSchema
		}
	}, MatchController.initiateMatch);

	fastify.patch('/match/finishgame', {
		schema: {
			body: matchFinishSchema
		}
	}, MatchController.finishMatch );
}

export default routes;