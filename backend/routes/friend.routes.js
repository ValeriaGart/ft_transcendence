import FriendController from '../controllers/friend.controller.js';
import {
	requestFriendSchema,
	friendStatusSchema
} from '../schemas/friend.schemas.js';

async function routes(fastify, options) {
	fastify.get('/friend', FriendController.getAllFriendships);

	// fastify.get('/friend/me', {
	// 	preHandler: [fastify.authenticate]
	// }, FriendController.getAllFriendshipsCurrentUser);
	
	fastify.post('/friend/me', {
		schema: {
			body: requestFriendSchema
		},
		preHandler: [fastify.authenticate]
	}, FriendController.requestFriend);

	fastify.get('/friend/status', {
		schema: {
			query: friendStatusSchema
		}
	}, FriendController.getFriendshipStatus);

	fastify.patch('/friend/me', {
		schema: {
			body: requestFriendSchema
		},
		preHandler: [fastify.authenticate]
	}, FriendController.acceptFriend);

}

export default routes;