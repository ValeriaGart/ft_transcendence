import argon2 from 'argon2';

/**
 * Hash a password using Argon2
 * @param {string} password - Plain text password
 * @returns {Promise<string>} - Hashed password
 */
export async function hashPassword(password) {
  try {
    const hash = await argon2.hash(password, {
      type: argon2.argon2id, // Use Argon2id variant (recommended)
      memoryCost: 2 ** 16,   // 64 MB memory cost
      timeCost: 3,           // 3 iterations
      parallelism: 1,        // 1 thread
	  hashLength: 32,        // 32 bytes output length
    });
    return hash;
  } catch (error) {
    throw new Error(`Password hashing failed: ${error.message}`);
  }
}

/**
 * Verify a password against its hash
 * @param {string} hash - Stored password hash
 * @param {string} password - Plain text password to verify
 * @returns {Promise<boolean>} - True if password matches
 */
export async function verifyPassword(hash, password) {
  try {
    return await argon2.verify(hash, password);
  } catch (error) {
    throw new Error(`Password verification failed: ${error.message}`);
  }
}