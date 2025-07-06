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
