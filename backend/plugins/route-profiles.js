// our-first-route.js

// /**
//  * Encapsulates the routes
//  * @param {FastifyInstance} fastify  Encapsulated Fastify Instance
//  * @param {Object} options plugin options, refer to https://fastify.dev/docs/latest/Reference/Plugins/#plugin-options
//  */

import { db } from './db-connector.js';

// const { db } = require('./db-connector');

async function routes (fastify, options) {

  // get all profiles
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

  // get profiles by ID 
  fastify.get('/profiles/:id', async (request, reply) => {
    const { id } = request.params;
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM profiles where id = ?', [id], (err, row) => {
        if (err) {
          reply.code(500);
          return reject({ error: 'Database error', details: err.message });
        }
        resolve (row);
      });
    });
  });


  fastify.put('/profiles/:id', {
    schema : {
      body: {
        type: "object",
        properties: {
          nickname: { type: 'string',  minLength: 2 },
          profilePictureUrl: { type: 'string', format: "url" },
          bio: { type: 'string', maxLength: 500}
        },
        required: [ "nickname", "profilePictureUrl", "bio" ],
      },
      params: {
        type: "object",
        properties: {
          id: { type: "number" }
        },
        required: [ "id" ]
      }
    },
  }, async (request, reply) => {
    const { nickname, profilePictureUrl, bio } = request.body;
    const { id } = request.params;


    return new Promise((resolve, reject) => {
      db.run(
        `UPDATE profiles
        SET nickname = ?, profilePictureUrl = ?, bio = ?, updatedAt = CURRENT_TIMESTAMP
        WHERE id = ?`,
        [nickname, profilePictureUrl, bio, id],
        function (err) {
          if (err) {
            reply.code(500);
            return reject({ error: 'Database error', details: err.message });
          }
          resolve({ success: true, message: "Profile updated"});
        }
      );
    });
  });
  
  
}

export default routes;