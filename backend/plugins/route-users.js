// our-first-route.js

// /**
//  * Encapsulates the routes
//  * @param {FastifyInstance} fastify  Encapsulated Fastify Instance
//  * @param {Object} options plugin options, refer to https://fastify.dev/docs/latest/Reference/Plugins/#plugin-options
//  */

import { db, initialize } from './db-connector.js';
import { hashPassword, verifyPassword } from './password-utils.js';

// const { db } = require('./db-connector');

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
	
	let hashedPassword;
	try {
		// Hash the password before storing it
		hashedPassword = await hashPassword(passwordString);
	} catch (error) {
	  reply.code(500);
	  return { error: 'Password hashing failed', details: error.message };
	}
	return new Promise((resolve, reject) => {
		
		db.serialize(() => {
			db.run('BEGIN TRANSACTION');

			db.run(
			`INSERT INTO users (email, passwordHash)
			VALUES (?, ?)`,
			[email, hashedPassword],
			function (err) {
				if (err) {
				db.run('ROLLBACK')
				console.error('User insert failed:', err.message);
				if (err.code === 'SQLITE_CONSTRAINT' && err.message.includes('UNIQUE')) {
					reply.code(409);
					return reject({ error: 'Email already exists' });
				}
				reply.code(500);
				return reject({ error: 'Database error', details: err.message });
				}

				db.run(
				`INSERT INTO profiles (nickname, bio, profilePictureUrl)
				VALUES (NULL, NULL, NULL)`,
				[],
				function (err) {
					if (err) {
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

	try {
		// Hash the password before updating it
		const hashedPassword = await hashPassword(passwordString);
	} catch (error) {
	  reply.code(500);
	  return { error: 'Password hashing failed', details: error.message };
	}
		
	return new Promise((resolve, reject) => {

	db.serialize(() => {
		db.run('BEGIN TRANSACTION');

		db.run(
		`UPDATE users 
		SET email = ? , passwordHash = ?, updatedAt = CURRENT_TIMESTAMP
		WHERE id = ?`,
		[email, hashedPassword, id],
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
        async function (err, row)  {
          if (err) {
            reply.code(500);
            return reject({ error: 'Database error', details: err.message });
          }
          if (!row){
            return reply.code(409).send({ error: 'Login Failure: Email not in Database' });
          }

		  try {
			// Verify the password against the stored hash
			const isPasswordValid = await verifyPassword(row.passwordHash, passwordString);
			} catch (error) {
			reply.code(500);
			return reject({ error: 'Password verification failed', details: error.message });
			}
		
		if (!isPasswordValid) {
			reply.code(401);
			return reject({ error: 'Login Failure: Password doesn\'t match up' });
		}

		const {passwordHash, ...userData} = row; // Exclude passwordHash from the response
		resolve({
			success: true,
			message: "Login Authentication successful",
			user: userData
		});
		}
        );
      });
  });
  
  
}

export default routes;