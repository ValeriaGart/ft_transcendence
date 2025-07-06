import MatchController from '../controllers/match.controller.js';
// import {
// 	matchParamsSchema
// } from '../schemas/match.schemas.js';

async function routes(fastify, options) {
	fastify.get('/match', MatchController.getAllMatches);

	fastify.get('/match/me', {
		preHandler: [fastify.authenticate]
	} , MatchController.getCurrentUserMatches);


}

export default routes;