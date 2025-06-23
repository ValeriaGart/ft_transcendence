export const profileBodySchema = {
  type: "object",
  properties: {
    nickname: { type: 'string', minLength: 2 },
    profilePictureUrl: { type: 'string', format: "uri" },
    bio: { type: 'string', maxLength: 500 }
  },
  required: ["nickname", "profilePictureUrl", "bio"]
};

export const profileParamsSchema = {
  type: "object",
  properties: {
    id: { type: "integer" }
  },
  required: ["id"]
};

export const profilePatchSchema = {
  type: "object",
  properties: {
    nickname: { type: 'string', minLength: 2 },
    profilePictureUrl: { type: 'string', format: "uri" },
    bio: { type: 'string', maxLength: 500 }
  },
  anyOf: [
    { required: ['nickname'] },
    { required: ['profilePictureUrl'] },
    { required: ['bio'] }
  ]
};