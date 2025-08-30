export const requestFriendSchema = {
	type: "object",
	properties: {
		friend_nickname: { type: 'string', minLength: 1 }
	},
	required: ['friend_nickname']
};

export const acceptFriendSchema = {
	type: "object",
	properties: {
		friend_id: { type: 'integer' }
	},
	required: ['friend_id']
};

export const friendStatusSchema = {
	type: "object",
	properties: {
		friend_id1: { type: 'integer' },
		friend_id2: { type: 'integer' }
	},
	required: [ 'friend_id1', 'friend_id2' ]
};

export const friendIdParamSchema = {
  type: 'object',
  properties: {
    friend_id: { type: 'integer' }
  },
  required: ['friend_id']
};