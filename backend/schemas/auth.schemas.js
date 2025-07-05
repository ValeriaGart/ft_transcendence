export const googleAuthSchema = {
  type: 'object',
  required: ['credential'],
  properties: {
    credential: {
      type: 'string',
      minLength: 1,
      description: 'Google ID token'
    }
  },
  additionalProperties: false
};

export const registerSchema = {
  type: 'object',
  required: ['email', 'password'],
  properties: {
    email: {
      type: 'string',
      format: 'email',
      maxLength: 255
    },
    password: {
      type: 'string',
      minLength: 8,
      maxLength: 128
    },
    name: {
      type: 'string',
      minLength: 1,
      maxLength: 100
    }
  },
  additionalProperties: false
};

export const loginSchema = {
  type: 'object',
  required: ['email', 'password'],
  properties: {
    email: {
      type: 'string',
      format: 'email',
      maxLength: 255
    },
    password: {
      type: 'string',
      minLength: 1,
      maxLength: 128
    }
  },
  additionalProperties: false
};
