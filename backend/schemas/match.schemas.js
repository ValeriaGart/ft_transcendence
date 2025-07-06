// export const matchTypeSchema = {
// 	type: "object",
// 	properties: {
// 		matchtype: { type: 'string', minLength: 2 }
// 	},
// 	required: ["matchtype"]
// };

export const matchStartSchema = {
	type: "object",
	properties: {
		player1: { type: 'integer' },
		player2: { type: 'integer' },
		matchtype: { type: 'string', minLength: 2 }
	},
	required: [ "player1", "player2", "matchtype"]
};

export const matchFinishSchema = {
	type: "object",
	properties: {
		player1_score: { type: 'integer' },
		player2_score: { type: 'integer' },
		match_id: { type: 'integer' }
	},
	required: [ "player1_score", "player2_score", "match_id"]
};
