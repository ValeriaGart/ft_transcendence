import { idText } from 'typescript';
import FriendService from '../services/friend.service.js'

class FriendController {
	static async getAllFriendships(request, reply) {
		try {
			console.log(`[FriendController] getAllFriendships`);
			const friend = await FriendService.getAllFriendships();
			return friend;
		} catch (error) {
			console.warn(`[FriendController] Error in getAllFriendships: `, error.message);
			reply.code(500);
			return { error: 'Failed to fetch all friendships', details: error.message };
		}
	}

	static async getAllFriendshipsUserId(request, reply) {
		try {
			const { friend_id } = request.params;
			console.log(`[FriendController] getAllFriendshipsUserId ${friend_id}`);
			const friend = await FriendService.getAllFriendshipsUserId(friend_id);
			return friend;
		} catch (error) {
			console.warn(`[FriendController] Error in getAllFriendshipsUserId: `, error.message);
			reply.code(500);
			return { error: 'Failed to fetch all friendships', details: error.message };
		}
	}
	

	static async getFriendshipStatus(request, reply) {
		try {
			const { friend_id1, friend_id2 } = request.query;
			console.log(`[FriendController] getFriendshipStatus of users ${friend_id1} and ${friend_id2}`);
			const friendstatus = await FriendService.getFriendshipStatus(friend_id1, friend_id2);
			return friendstatus;
		} catch (error) {
			console.warn(`[FriendController] Error in getFriendshipStatus: `, error.message);
			reply.code(500);
			return { error: 'Failed to get status on friendship', details: error.message };
		}
	}

	static async requestFriend(request, reply) {
		try {
			const userId = request.user.userId;
			const { friend_id } = request.body;
			console.log(`[FriendController] User ${userId} requested friendship with User ${friend_id}`);
			const friend = await FriendService.requestFriend(userId, friend_id);
			return friend;
		} catch (error) {
			console.warn(`[FriendController] Error in requestFriend: `, error.message);
			reply.code(500);
			return { error: 'Failed to request friendship', details: error.message };
		}
	}
	
	static async acceptFriend(request, reply) {
		try {
			const userId = request.user.userId;
			const { friend_id } = request.body;
			console.log(`[FriendController] User ${userId} accepts friend request from User ${friend_id}`);
			const friend = await FriendService.acceptFriend(userId, friend_id);
			return friend;
		} catch (error) {
			console.warn(`[FriendController] Error in acceptFriend: `, error.message);
			reply.code(500);
			return { error: 'Failed to accept friendship', details: error.message };
		}
	}

	


}

export default FriendController;