import FriendService from '../services/friend.service.js'
import ProfileService from '../services/profile.service.js'
import { log, DEBUG, INFO, WARN, ERROR } from '../utils/logger.utils.js';

class FriendController {
	static async getAllFriendships(request, reply) {
		try {
			log(`[FriendController] getAllFriendships`, DEBUG);
			const friend = await FriendService.getAllFriendships();
			return friend;
		} catch (error) {
			log(`[FriendController] Error in getAllFriendships: ` + error.message, WARN);
			reply.code(500);
			return { error: 'Failed to fetch all friendships', details: error.message };
		}
	}

	static async getAllFriendshipsUserId(request, reply) {
		try {
			const { friend_id } = request.params;
			log(`[FriendController] getAllFriendshipsUserId ${friend_id}`, DEBUG);
			const friend = await FriendService.getAllFriendshipsUserId(friend_id);
			return friend;
		} catch (error) {
			log(`[FriendController] Error in getAllFriendshipsUserId: ` + error.message, WARN);
			reply.code(500);
			return { error: 'Failed to fetch all friendships', details: error.message };
		}
	}
	

	static async getFriendshipStatus(request, reply) {
		try {
			const { friend_id1, friend_id2 } = request.query;
			log(`[FriendController] getFriendshipStatus of users ${friend_id1} and ${friend_id2}`, DEBUG);
			const friendstatus = await FriendService.getFriendshipStatus(friend_id1, friend_id2);
			return friendstatus;
		} catch (error) {
			log(`[FriendController] Error in getFriendshipStatus: ` + error.message, WARN);
			reply.code(500);
			return { error: 'Failed to get status on friendship', details: error.message };
		}
	}

	static async requestFriend(request, reply) {
		try {
			const userId = request.user.userId;
			const { friend_nickname } = request.body;

			try {
				const { userId: friendId } = await ProfileService.getIdByNick(friend_nickname);
				return await FriendService.requestFriend(userId, friendId);
			} catch (error) {
				log(`[FriendController] Error resolving nickname '${friend_nickname}': ` + error.message, WARN);
				if (typeof error.message === 'string' && error.message.includes('No such user')) {
					reply.code(404);
					return { error: 'User not found', details: `No user found with nickname '${friend_nickname}'` };
				} else {
					reply.code(500);
					return { error: 'Failed to resolve user', details: error.message };
				}
			}
		} catch (error) {
			log(`[FriendController] Error in requestFriend: ` + error.message, WARN);
			reply.code(500);
			return { error: 'Failed to request friendship', details: error.message };
		}
	}

	static async acceptFriend(request, reply) {
		try {
			const userId = request.user.userId;
			const { friend_id } = request.body;
			log(`[FriendController] User ${userId} accepts friend request from User ${friend_id}`, DEBUG);
			return await FriendService.acceptFriend(userId, friend_id);
		} catch (error) {
			log(`[FriendController] Error in acceptFriend: ` + error.message, WARN);
			reply.code(500);
			return { error: 'Failed to accept friendship', details: error.message };
		}
	}
}

export default FriendController;