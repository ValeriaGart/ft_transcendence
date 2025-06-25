import { db, initialize } from './db-connector.js';
import { hashPassword, verifyPassword } from './password-utils.js';

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
	
	try {
		// Check if user already exists
		const existingUser = await new Promise((resolve, reject) => {
			db.get(
				'SELECT * FROM users WHERE email = ?',
				[email],
				(err, row) => {
					if (err) reject(err);
					else resolve(row);
				}
			);
		});
		
		if (existingUser) {
			// If user exists and has a Google account but no password, allow password addition
			if (existingUser.googleId && !existingUser.passwordHash) {
				const hashedPassword = await hashPassword(passwordString);
				
				await new Promise((resolve, reject) => {
					db.run(
						'UPDATE users SET passwordHash = ? WHERE id = ?',
						[hashedPassword, existingUser.id],
						function(err) {
							if (err) reject(err);
							else resolve(this.changes);
						}
					);
				});
				
				return { 
					success: true, 
					userId: existingUser.id,
					message: 'Password added to existing Google account',
					linked: true
				};
			} else {
				reply.code(409);
				return { 
					error: 'User already exists',
					details: 'This email is already registered. Please use a different email or try logging in.'
				};
			}
		}
		
		// Hash the password before storing it
		const hashedPassword = await hashPassword(passwordString);
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
              reply.code(500);
              return reject({ error: 'Database error', details: err.message });
            }
            
            db.run(
              `INSERT INTO profiles (userId, nickname, bio, profilePictureUrl)
              VALUES (NULL, NULL, NULL, NULL)`,
              [this.lastID],
              function (err) {
                if (err) {
                  db.run('ROLLBACK');
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
      } catch (error) {
        reply.code(500);
        return { error: 'Password hashing failed', details: error.message };
      }
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
          id: { type: "integer" }
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
    } catch (error) {
      reply.code(500);
      return { error: 'Password hashing failed', details: error.message };
    }
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
        
        if (!isPasswordValid) {
          reply.code(401);
          return reject({ error: 'Login Failure: Password doesn\'t match up' });
        }
      } catch (error) {
      reply.code(500);
      return reject({ error: 'Password verification ran into an exceptional error', details: error.message });
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