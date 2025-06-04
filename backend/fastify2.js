// Import Fastify
const fastify = require('fastify')({ logger: true });

// Define schema for validation
const userSchema = {
  type: 'object',
  required: ['name', 'email'],
  properties: {
    name: { type: 'string' },
    email: { type: 'string', format: 'email' }
  }
};

// In-memory data store
let users = [
  { id: 1, name: 'John Doe', email: 'john@example.com' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
];

// GET all users
fastify.get('/users', async () => {
  return users;
});

// GET single user
fastify.get('/users/:id', {
  schema: {
    params: {
      type: 'object',
      required: ['id'],
      properties: {
        id: { type: 'number' }
      }
    }
  }
}, async (request, reply) => {
  const user = users.find(u => u.id === parseInt(request.params.id));
  if (!user) {
    throw fastify.httpErrors.notFound('User not found');
  }
  return user;
});

// POST new user
fastify.post('/users', {
  schema: {
    body: userSchema
  }
}, async (request, reply) => {
  const newUser = {
    id: users.length + 1,
    ...request.body
  };
  users.push(newUser);
  return newUser;
});

// PUT update user
fastify.put('/users/:id', {
  schema: {
    params: {
      type: 'object',
      required: ['id'],
      properties: {
        id: { type: 'number' }
      }
    },
    body: userSchema
  }
}, async (request, reply) => {
  const index = users.findIndex(u => u.id === parseInt(request.params.id));
  if (index === -1) {
    throw fastify.httpErrors.notFound('User not found');
  }
  
  users[index] = {
    ...users[index],
    ...request.body,
    id: users[index].id // Preserve ID
  };
  return users[index];
});

// DELETE user
fastify.delete('/users/:id', {
  schema: {
    params: {
      type: 'object',
      required: ['id'],
      properties: {
        id: { type: 'number' }
      }
    }
  }
}, async (request, reply) => {
  const index = users.findIndex(u => u.id === parseInt(request.params.id));
  if (index === -1) {
    throw fastify.http.Errors.notFound('User not found');
  }
  return users.splice(index, 1)[0];
});

// Add root route
fastify.get('/', async () => {
  return {
    message: 'Welcome to the Fastify API',
    availableEndpoints: [
      '/users',
      '/users/:id',
      '/users (POST)',
      '/users/:id (PUT)',
      '/users/:id (DELETE)'
    ]
  };
});

// Add favicon route
fastify.get('/favicon.ico', async () => {
  return {
    message: 'Favicon endpoint'
  };
});

// Run the server!
const start = async () => {
  try {
    await fastify.listen({ port: 3000 });
    console.log(`server listening on ${fastify.server.address().port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();