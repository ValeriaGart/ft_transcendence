// our-first-route.js

// /**
//  * Encapsulates the routes
//  * @param {FastifyInstance} fastify  Encapsulated Fastify Instance
//  * @param {Object} options plugin options, refer to https://fastify.dev/docs/latest/Reference/Plugins/#plugin-options
//  */

import { db } from './db-connector.js';

// const { db } = require('./db-connector');

async function routes (fastify, options) {

  fastify.get('/profiles', async (request, reply) => {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM profiles', (err, rows) => {
        if (err) {
          reply.code(500);
          return reject({ error: 'Database error', details: err.message });
        }
        resolve (rows);
      });
    });
  });


  fastify.put('/profiles', {
    schema : {
      body: {
        type: "object",
        properties: {
          id: { type: 'integer' },
          nickname: { type: 'string',  minLength: 2 },
          profilePictureUrl: { type: 'string', format: "url" },
          bio: { type: 'string', maxLength: 500}
        },
        required: ["id"],
      },
    },
  }, async (request, reply) => {
    const { id, nickname, profilePictureUrl, bio } = request.body;


    return new Promise((resolve, reject) => {
      db.run(
        `UPDATE profiles
        SET nickname = ?, updatedAt = ?
        WHERE id = ?`,
        [nickname, new Date().toISOString(), id],
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