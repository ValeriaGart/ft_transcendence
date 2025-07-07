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


}

export default FriendService;