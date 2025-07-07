export const requestFriendSchema = {
	type: "object",
	properties: {
		friend_id: { type: 'integer' }
	},
	required: [ 'friend_id' ]
};