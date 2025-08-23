import MatchController from '../controllers/match.controller.js';
import {
	matchStartSchema,
	matchFinishSchema,
	matchParamsSchema
} from '../schemas/match.schemas.js';

async function routes(fastify, options) {
	// Get all matches (admin/debug endpoint)
	fastify.get('/match', {
		preHandler: [fastify.authenticate]
	}, MatchController.getAllMatches);

	// Get current user's matches (authenticated)
	fastify.get('/match/me', {
		preHandler: [fastify.authenticate]
	}, MatchController.getCurrentUserMatches);

	// Get current user's match history with nicknames (authenticated)
	fastify.get('/match/history/me', {
		preHandler: [fastify.authenticate]
	}, MatchController.getCurrentUserMatchHistory);

	// Get all matches for a specific user by user ID
	fastify.get('/match/:id', {
		schema: { params: matchParamsSchema }
	}, MatchController.getAllMatchesByUserId);

	// Get match history with nicknames for a specific user by user ID
	fastify.get('/match/history/:id', {
		schema: { params: matchParamsSchema }
	}, MatchController.getMatchHistoryWithNicknames);

	// Get win/loss statistics for a specific user by user ID
	fastify.get('/match/wl/:id', {
		schema: { params: matchParamsSchema }
	}, MatchController.getWinsLossesById);

	// Start a new match
	fastify.post('/match/startgame', {
		schema: {
			body: matchStartSchema
		},
		preHandler: [fastify.authenticate]
	}, MatchController.initiateMatch);

	// Finish an existing match
	fastify.patch('/match/finishgame', {
		schema: {
			body: matchFinishSchema
		},
		preHandler: [fastify.authenticate]
	}, MatchController.finishMatch);

	// Delete a match by match ID
	fastify.delete('/match/:id', {
		schema: { params: matchParamsSchema },
		preHandler: [fastify.authenticate]
	}, MatchController.deleteMatch);
}

export default routes;