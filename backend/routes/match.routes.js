import MatchController from '../controllers/match.controller.js';


async function routes(fastify, options) {
	fastify.get('/match', MatchController.getAllMatches);
}

export default routes;