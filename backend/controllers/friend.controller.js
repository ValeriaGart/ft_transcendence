import FriendService from '../services/friend.service.js'

class FriendController {
	static async getAllFriendships(request, reply) {
		try {
			const friend = await FriendService.getAllFriendships();
			return friend;
		} catch (error) {
			reply.code(500);
			return { error: 'Failed to fetch all friendships', details: error.message };
		}
	}

	static async requestFriend(request, reply) {
		try {
			const userId = request.user.userId;
			const { friend_id } = request.body;
			const friend = await FriendService.requestFriend(userId, friend_id);
			return friend;
		} catch (error) {
			reply.code(500);
			return { error: 'Failed to request friendship', details: error.message };
		}
	}

	


}

export default FriendController;