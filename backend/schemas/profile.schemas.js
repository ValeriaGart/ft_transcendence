export const profileBodySchema = {
  type: "object",
  properties: {
    nickname: { 
      type: 'string', 
      minLength: 2, 
      maxLength: 20,
      pattern: '^[a-zA-Z0-9][a-zA-Z0-9_-]*$',
      description: 'Nickname must be 2-20 characters, start with alphanumeric, and contain only letters, numbers, underscores, and hyphens'
    },
    profilePictureUrl: { 
      type: 'string', 
      minLength: 1,
      maxLength: 500,
      description: 'Profile picture URL must be a valid HTTP/HTTPS URL or relative path'
    },
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
    nickname: { 
      type: 'string', 
      minLength: 2, 
      maxLength: 20,
      pattern: '^[a-zA-Z0-9][a-zA-Z0-9_-]*$',
      description: 'Nickname must be 2-20 characters, start with alphanumeric, and contain only letters, numbers, underscores, and hyphens'
    },
    profilePictureUrl: { 
      type: 'string', 
      minLength: 1,
      maxLength: 500,
      description: 'Profile picture URL must be a valid HTTP/HTTPS URL or relative path'
    },
    bio: { type: 'string', maxLength: 500 }
  },
  anyOf: [
    { required: ['nickname'] },
    { required: ['profilePictureUrl'] },
    { required: ['bio'] }
  ]
};

export const nicknameSuggestionSchema = {
  type: "object",
  properties: {
    baseNickname: { 
      type: 'string', 
      minLength: 2,
      maxLength: 20,
      description: 'Base nickname to generate suggestions from'
    }
  },
  required: ['baseNickname']
};