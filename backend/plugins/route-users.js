// our-first-route.js

// /**
//  * Encapsulates the routes
//  * @param {FastifyInstance} fastify  Encapsulated Fastify Instance
//  * @param {Object} options plugin options, refer to https://fastify.dev/docs/latest/Reference/Plugins/#plugin-options
//  */

import { db, initialize } from './db-connector.js';

// const { db } = require('./db-connector');

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


  fastify.post('/users', {
    schema : {
      body: {
        type: "object",
        properties: {
          email: { type: 'string', format: 'email' },
          passwordString: { type: 'string', minLength: 6 },
        },
        required: ["email", "passwordString"],
      },
    },
  }, async (request, reply) => {
    const { email, passwordString } = request.body;


    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO users (email, passwordHash, createdAt)
        VALUES (?, ?, ?)`,
        [email, passwordString, new Date().toISOString()],
        function (err) {
          if (err) {
            reply.code(500);
            return reject({ error: 'Database error', details: err.message });
          }
          resolve({ success: true, userId: this.lastID});
        }
      );
    });
  });
  
  
}

export default routes;