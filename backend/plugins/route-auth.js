/**
 * Authentication Routes
 * Handles Google OAuth login, token verification, and user authentication
 */

import { db } from './db-connector.js';
import { verifyGoogleToken, generateJWT, verifyJWT, AUTH_CONFIG } from './auth-utils.js';
import { hashPassword, verifyPassword } from './password-utils.js';

async function authRoutes(fastify, options) {
  
  /**
   * Google OAuth Authentication
   * Receives Google ID token from frontend and processes authentication
   */
  fastify.post('/auth/google', {
    schema: {
      body: {
        type: 'object',
        properties: {
          idToken: { type: 'string' }
        },
        required: ['idToken']
      }
    }
  }, async (request, reply) => {
    const { idToken } = request.body;
    
    try {
      // Verify Google token
      const googleUser = await verifyGoogleToken(idToken);
      if (!googleUser) {
        reply.code(401);
        return { error: 'Invalid Google token' };
      }
      
      // Check if user exists in database (check by email first, then by googleId)
      const existingUser = await new Promise((resolve, reject) => {
        db.get(
          'SELECT * FROM users WHERE email = ?',
          [googleUser.email],
          (err, row) => {
            if (err) reject(err);
            else resolve(row);
          }
        );
      });
      
      let user;
      
      if (existingUser) {
        // Update existing user with Google information (link accounts)
        user = await new Promise((resolve, reject) => {
          db.run(
            'UPDATE users SET googleId = ?, profilePictureUrl = COALESCE(profilePictureUrl, ?), name = COALESCE(name, ?) WHERE id = ?',
            [googleUser.googleId, googleUser.profilePictureUrl, googleUser.name, existingUser.id],
            function(err) {
              if (err) {
                reject(err);
              } else {
                resolve({
                  id: existingUser.id,
                  email: existingUser.email,
                  googleId: googleUser.googleId,
                  profilePictureUrl: googleUser.profilePictureUrl || existingUser.profilePictureUrl,
                  name: googleUser.name || existingUser.name,
                  authMethod: 'linked' // Indicates account was linked
                });
              }
            }
          );
        });
      } else {
        // Check if a Google account already exists with this googleId
        const existingGoogleUser = await new Promise((resolve, reject) => {
          db.get(
            'SELECT * FROM users WHERE googleId = ?',
            [googleUser.googleId],
            (err, row) => {
              if (err) reject(err);
              else resolve(row);
            }
          );
        });
        
        if (existingGoogleUser) {
          // User exists with Google ID, just return the user
          user = {
            id: existingGoogleUser.id,
            email: existingGoogleUser.email,
            googleId: existingGoogleUser.googleId,
            profilePictureUrl: existingGoogleUser.profilePictureUrl,
            name: existingGoogleUser.name,
            authMethod: 'google'
          };
        } else {
          // Create new user with Google authentication
          user = await new Promise((resolve, reject) => {
            db.serialize(() => {
              db.run('BEGIN TRANSACTION');
              
              db.run(
                'INSERT INTO users (email, googleId, profilePictureUrl, name) VALUES (?, ?, ?, ?)',
                [googleUser.email, googleUser.googleId, googleUser.profilePictureUrl, googleUser.name],
                function(err) {
                  if (err) {
                    db.run('ROLLBACK');
                    reject(err);
                    return;
                  }
                  
                  const userId = this.lastID;
                  
                  // Create profile entry
                  db.run(
                    'INSERT INTO profiles (userId, nickname, bio, profilePictureUrl) VALUES (?, ?, ?, ?)',
                    [userId, googleUser.name, null, googleUser.profilePictureUrl],
                    function(err) {
                      if (err) {
                        db.run('ROLLBACK');
                        reject(err);
                        return;
                      }
                      
                      db.run('COMMIT');
                      resolve({
                        id: userId,
                        email: googleUser.email,
                        googleId: googleUser.googleId,
                        profilePictureUrl: googleUser.profilePictureUrl,
                        name: googleUser.name,
                        authMethod: 'google'
                      });
                    }
                  );
                }
              );
            });
          });
        }
      }
      
      // Generate JWT token
      const token = generateJWT(user);
      
      // Set cookie and return user data
      reply.setCookie('auth_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });
      
      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          profilePictureUrl: user.profilePictureUrl
        },
        token
      };
      
    } catch (error) {
      console.error('Google authentication error:', error);
      reply.code(500);
      return { error: 'Authentication failed', details: error.message };
    }
  });
  
  /**
   * Traditional email/password login
   */
  fastify.post('/auth/login', {
    schema: {
      body: {
        type: 'object',
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string' }
        },
        required: ['email', 'password']
      }
    }
  }, async (request, reply) => {
    const { email, password } = request.body;
    
    try {
      // Find user by email
      const user = await new Promise((resolve, reject) => {
        db.get(
          'SELECT * FROM users WHERE email = ?',
          [email],
          (err, row) => {
            if (err) reject(err);
            else resolve(row);
          }
        );
      });
      
      if (!user) {
        reply.code(401);
        return { error: 'Invalid email or password' };
      }
      
      // Check if user has a password hash (supports local login)
      if (!user.passwordHash) {
        reply.code(401);
        return { 
          error: 'This account was created with Google Sign-in. Please use Google to sign in, or contact support to set up a password.',
          authHint: 'google_only'
        };
      }
      
      // Verify password
      const isValidPassword = await verifyPassword(password, user.passwordHash);
      if (!isValidPassword) {
        reply.code(401);
        return { error: 'Invalid email or password' };
      }
      
      // Generate JWT token
      const token = generateJWT(user);
      
      // Set cookie and return user data
      reply.setCookie('auth_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });
      
      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          profilePictureUrl: user.profilePictureUrl
        },
        token
      };
      
    } catch (error) {
      console.error('Login error:', error);
      reply.code(500);
      return { error: 'Login failed', details: error.message };
    }
  });
  
  /**
   * Token verification endpoint
   */
  fastify.get('/auth/verify', async (request, reply) => {
    const token = request.cookies.auth_token || 
                  (request.headers.authorization && request.headers.authorization.replace('Bearer ', ''));
    
    if (!token) {
      reply.code(401);
      return { error: 'No token provided' };
    }
    
    const payload = verifyJWT(token);
    if (!payload) {
      reply.code(401);
      return { error: 'Invalid or expired token' };
    }
    
    // Get current user data
    try {
      const user = await new Promise((resolve, reject) => {
        db.get(
          'SELECT id, email, name, profilePictureUrl FROM users WHERE id = ?',
          [payload.userId],
          (err, row) => {
            if (err) reject(err);
            else resolve(row);
          }
        );
      });
      
      if (!user) {
        reply.code(401);
        return { error: 'User not found' };
      }
      
      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          profilePictureUrl: user.profilePictureUrl
        }
      };
      
    } catch (error) {
      console.error('Token verification error:', error);
      reply.code(500);
      return { error: 'Verification failed' };
    }
  });
  
  /**
   * Logout endpoint
   */
  fastify.post('/auth/logout', async (request, reply) => {
    // Clear the authentication cookie
    reply.clearCookie('auth_token');
    return { success: true, message: 'Logged out successfully' };
  });
}

export default authRoutes;
