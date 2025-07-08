import { dbRun, dbGet, dbAll } from "../config/database.js"

class FriendService {
	static async getAllFriendships() {
		const friend = await dbAll('SELECT * FROM friend');
		return friend;
	}

	static async requestFriend(id, friend_id) {

		// if friendship request already exists error
		// if friendship already exists error
		const friend = await dbRun(
			'INSERT INTO friend (initiator_id, recipient_id) VALUES (?, ?)',
			[id, friend_id]
		);
		return friend;
	}


	static async acceptFriend(id, friend_id) {

		// if friendship request already exists error
		// if friendship already exists error
		const friend = await dbRun(
			'UPDATE friend \
				SET accepted = 1, acceptedAt = CURRENT_TIMESTAMP \
				WHERE initiator_id = ? and recipient_id = ?',
			[friend_id, id]
		);
		return friend;
	}
}

export default FriendService;