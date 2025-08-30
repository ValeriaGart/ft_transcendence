import FriendController from '../controllers/friend.controller.js';
import {
	requestFriendSchema,
	acceptFriendSchema,
	friendStatusSchema
} from '../schemas/friend.schemas.js';

async function routes(fastify, options) {
	fastify.get('/friend', FriendController.getAllFriendships);

	fastify.get('/friend/:friend_id', {
		schema: { params: { type: 'object', properties: { friend_id: { type: 'integer' } }, required: ['friend_id'] } },
		preHandler: [fastify.authenticate]
	}, FriendController.getAllFriendshipsUserId);
	
	fastify.post('/friend/me', {
		schema: {
			body: requestFriendSchema
		},
		preHandler: [fastify.authenticate]
	}, FriendController.requestFriend);

/* return "null" for pending, "1" for existing friendship, and error message for non-existing */
	fastify.get('/friend/status', {
		schema: {
			query: friendStatusSchema
		},
		preHandler: [fastify.authenticate]
	}, FriendController.getFriendshipStatus);

	fastify.patch('/friend/me', {
		schema: {
			body: acceptFriendSchema
		},
		preHandler: [fastify.authenticate]
	}, FriendController.acceptFriend);

}

export default routes;