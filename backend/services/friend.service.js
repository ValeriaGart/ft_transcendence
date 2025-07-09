import { dbRun, dbGet, dbAll } from "../config/database.js"

class FriendService {
	static async getAllFriendships() {
		const friend = await dbAll('SELECT * FROM friend');
		return friend;
	}

	static async getFriendshipStatus(id, friend_id) {
		const friendship = await dbGet(
			`SELECT * FROM friend \
			WHERE \
				(initiator_id = ? AND recipient_id = ?) \
				OR \
				(recipient_id = ? AND initiator_id = ?)`,
			[id, friend_id, id, friend_id]
		);
		if (!friendship) {
			throw new Error('No friendship found between the specified users.');
		}
		return friendship;
	}

	static async getFriends(id) {
		const friends = await dbAll(
			`SELECT * FROM friend \
			WHERE \
				(initiator_id = ? OR recipient_id = ?) \
				AND accepted = 1`,
			[id, id]
		);
		if (!friends.length) {
			throw new Error('No friends found for the specified user.');
		}
		return friends;
	}

	static async requestFriend(id, friend_id) {

		if (!id || !friend_id) {
			throw new Error('Both user IDs must be provided.');
		}
		if (id === friend_id) {
			throw new Error('You cannot send a friendship request to yourself.');
		}

		// if friendship request already exists error
		if (dbGet(`SELECT * FROM friend \
				WHERE \
					(initiator_id = ? and recipient_id = ?) \
					OR \
					(recipient_id = ? and initiator_id = ?)`, 
			[id, friend_id, id, friend_id]))
		{
			throw new Error ('Friendship already exists');
		}
		// if friendship already exists error
		const friend = await dbRun(
			'INSERT INTO friend (initiator_id, recipient_id) VALUES (?, ?)',
			[id, friend_id]
		);
		return friend;
	}


	static async acceptFriend(id, friend_id) {

		if (!id || !friend_id) {
			throw new Error('Both user IDs must be provided.');
		}

		// Check if the friendship request exists and is pending
		const friendship = await dbGet(
			`SELECT * FROM friend \
			WHERE initiator_id = ? AND recipient_id = ? AND accepted = NULL`,
			[friend_id, id]
		);
		if (!friendship) {
			throw new Error('No pending friendship request found to accept.');
		}

		const friend = await dbRun(
			'UPDATE friend \
				SET accepted = 1, acceptedAt = CURRENT_TIMESTAMP \
				WHERE initiator_id = ? AND recipient_id = ?',
			[friend_id, id]
		);
		return friend;
	}
}

export default FriendService;