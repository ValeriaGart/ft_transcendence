import { db, initialize } from './db-connector.js';

async function routes (fastify, options) {

  fastify.get('/', async (request, reply) => {
    return { hello: 'world' }
  });

// get all users
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

// get user by ID
  fastify.get('/users/:id', async (request, reply) => {
    const { id } = request.params;
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE id = ?', [id], (err, row) => {
        if (err) {
          reply.code(500);
          return reject({ error: 'Database error', details: err.message });
        }
        resolve (row);
      });
    });
  });

// register user
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

      db.serialize(() => {
        db.run('BEGIN TRANSACTION');

        db.run(
          `INSERT INTO users (email, passwordHash)
          VALUES (?, ?)`,
          [email, passwordString],
          function (err) {
            if (err) {
              db.run('ROLLBACK')
              console.error('User insert failed:', err.message);
              reply.code(500);
              return reject({ error: 'Database error', details: err.message });
            }
            
            db.run(
              `INSERT INTO profiles (nickname, bio, profilePictureUrl)
              VALUES (NULL, NULL, NULL)`,
              [],
              function (err) {
                if (err) {
                  db.run('ROLLBACK')
                  reply.code(500);
                  console.error('Profile insert failed:', err.message);
                  return reject({ error: 'Database error', details: err.message });

                }

                db.run('COMMIT');
                console.log('Both inserts succeeded!');

                resolve({ success: true, userId: this.lastID});
              });
            });
          });
        });
      });
  
// update user information
  fastify.put('/users/:id', {
    schema : {
      body: {
        type: "object",
        properties: {
          email: { type: 'string', format: 'email' },
          passwordString: { type: 'string', minLength: 6 },
        },
        required: ["email", "passwordString"],
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
    const { email, passwordString } = request.body;
    const { id } = request.params;


    return new Promise((resolve, reject) => {

      db.serialize(() => {
        db.run('BEGIN TRANSACTION');

        db.run(
          `UPDATE users 
          SET email = ? , passwordHash = ?, updatedAt = CURRENT_TIMESTAMP
          WHERE id = ?`,
          [email, passwordString, id],
          function (err) {
            if (err) {
              db.run('ROLLBACK')
              console.error('User information update failed:', err.message);
              reply.code(500);
              return reject({ error: 'Database error', details: err.message });
            }
            db.run('COMMIT');
            resolve({ success: true, userId: this.lastID});
            });
          });
        });
      });
  
  // login user
  fastify.post('/users/login', {
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
      db.get(
        `SELECT * FROM users
        WHERE email = ?`,
        [email],
        function (err, row)  {
          if (err) {
            reply.code(500);
            return reject({ error: 'Database error', details: err.message });
          }
          if (!row){
            return reply.code(409).send({ error: 'Login Failure: Email not in Database' });
          }
          db.get(
            `SELECT * FROM users
            WHERE email = ? and passwordHash = ?`,
            [email, passwordString],
            function (err, row)  {
              if (err) {
                reply.code(500);
                return reject({ error: 'Database error', details: err.message });
              }
              if (!row){
                return reply.code(401).send({ error: 'Login Failure: Password doesn\'t match up' });
              }
              
              resolve({ success: true, message: "Login Authentication successful"});
            }
          );
          
        }
      );
    });
  });
  
  
}

export default routes;