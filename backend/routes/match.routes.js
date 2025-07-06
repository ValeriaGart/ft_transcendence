import MatchController from '../controllers/match.controller.js';
import {
	matchStartSchema,
	matchFinishSchema,
	matchParamsSchema
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

	fastify.delete('/match/:id', {
		schema: { params: matchParamsSchema }
	}, MatchController.deleteMatch);
}

export default routes;