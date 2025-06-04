// Import Fastify
const fastify = require('fastify')({ logger: true });
const { db, initialize } = require('./db');

// Define schema for validation
const userSchema = {
  type: 'object',
  required: ['name', 'email'],
  properties: {
    name: { type: 'string' },
    email: { type: 'string', format: 'email' }
  }
};


async function routes(fastify, opts) {
  // GET all users
  fastify.get('/users', async () => {
    return await fastify.db.all('SELECT * FROM users');
  });

  // GET single user
  fastify.get('/users/:id', {
    schema: {
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    const user = await fastify.db.get('SELECT * FROM users WHERE id = ?', [request.params.id]);
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
      id: crypto.randomUUID(),
      ...request.body
    };
    await fastify.db.run(
      'INSERT INTO users (id, email, passwordHash) VALUES (?, ?, ?)',
      [newUser.id, newUser.email, newUser.passwordHash]
    );
    return newUser;
  });
}

module.exports = routes;

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


async function bootstrap() {
  try {
    await initialize();
    await fastify.listen({ port: 3000 });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}
bootstrap();
