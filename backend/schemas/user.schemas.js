export const userBodySchema = {
  type: 'object',
  required: ['email', 'passwordString'],
  properties: {
    email: { type: 'string', format: 'email' },
    passwordString: { type: 'string', minLength: 6, maxLength: 20 }
  }
};

export const userPatchSchema = {
  type: 'object',
  properties: {
    email: { type: 'string', format: 'email' },
    passwordString: { type: 'string', minLength: 6, maxLength: 20 }
  },
  anyOf: [
    { required: ['email'] },
    { required: ['passwordString'] }
  ]
};

export const userParamsSchema = {
  type: 'object',
  properties: {
    id: { type: 'integer' }
  },
  required: ['id']
};

export const loginSchema = {
  type: 'object',
  required: ['email', 'passwordString'],
  properties: {
    email: { type: 'string', format: 'email' },
    passwordString: { type: 'string', minLength: 1, maxLength: 20 }
  }
};