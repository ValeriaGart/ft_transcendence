// our-first-route.js

/**
 * Encapsulates the routes
 * @param {FastifyInstance} fastify  Encapsulated Fastify Instance
 * @param {Object} options plugin options, refer to https://fastify.dev/docs/latest/Reference/Plugins/#plugin-options
 */

const { db } = require('./our-db-route');


async function routes (fastify, options) {

  fastify.get('/', async (request, reply) => {
    return { hello: 'world' }
  });

  fastify.get('/users', async (request, reply) => {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM users', (err, rows) => {
        if (err) {
          reply.code(500);
          return reject({ error: 'Database error', details: err.message });
        }
        resolve (rows);
      });
    });
  });

  fastify.post('/users', async (request, reply) => {
    const { id, email, passwordString } = request.body;

    if (!id || !email || !passwordString) {
      reply.code(400);
      return { error: 'id, email and password are required'};
    }

    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO users (id, email, passwordHash, createdAt)
        VALUES (?, ?, ?, ?)`,
        [id, email, passwordString, new Date().toISOString()],
        function (err) {
          if (err) {
            reply.code(500);
            return reject({ error: 'Database error', details: err.message });
          }
          resolve({ success: true, userId: id});
        }
      );
    });
  });
  
  
}


module.exports = routes;