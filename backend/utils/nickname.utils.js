import { dbGet } from '../config/database.js';

/**
 * Check if a nickname already exists in the database
 * @param {string} nickname - The nickname to check
 * @returns {Promise<boolean>} - True if nickname exists, false otherwise
 */
export async function nicknameExists(nickname) {
  try {
    const result = await dbGet(
      'SELECT id FROM profiles WHERE nickname = ?',
      [nickname]
    );
    return !!result;
  } catch (error) {
    log(`Error checking nickname existence for "${nickname}":` + error, WARN);
    throw new Error('Database error while checking nickname existence');
  }
}

/**
 * Generate a unique nickname by adding an underscore and number
 * @param {string} baseNickname - The base nickname to make unique
 * @returns {Promise<string>} - A unique nickname
 */
export async function generateUniqueNickname(baseNickname) {
  // Clean the base nickname first
  const cleanedBase = cleanNickname(baseNickname);
  let nickname = cleanedBase;
  let counter = 1;
  
  while (await nicknameExists(nickname)) {
    nickname = `${cleanedBase}_${counter}`;
    counter++;
    
    // Prevent infinite loops (max 1000 attempts)
    if (counter > 1000) {
      throw new Error('Unable to generate unique nickname after 1000 attempts. Too many users with similar nicknames.');
    }
  }
  
  return nickname;
}

/**
 * Generate a nickname from user data with fallback logic
 * @param {Object} userData - User data object
 * @param {string} userData.name - User's name (optional)
 * @param {string} userData.email - User's email
 * @param {string} userData.googleName - Google display name (optional)
 * @returns {Promise<string>} - A unique nickname
 */
export async function generateNicknameFromUserData(userData) {
  let baseNickname = '';
  
  // Priority order: provided name > Google name > email prefix
  if (userData.name && userData.name.trim()) {
    baseNickname = userData.name.trim();
  } else if (userData.googleName && userData.googleName.trim()) {
    baseNickname = userData.googleName.trim();
  } else if (userData.email) {
    baseNickname = userData.email.split('@')[0];
  } else {
    throw new Error('No valid data provided for nickname generation');
  }
  
  // Clean the nickname (remove special characters, limit length)
  baseNickname = cleanNickname(baseNickname);
  
  // Generate unique nickname
  return await generateUniqueNickname(baseNickname);
}

/**
 * Clean and validate a nickname
 * @param {string} nickname - Raw nickname
 * @returns {string} - Cleaned nickname
 */
export function cleanNickname(nickname) {
  if (!nickname || typeof nickname !== 'string') {
    throw new Error('Invalid nickname provided');
  }
  
  // Remove special characters, keep only alphanumeric, underscore, and hyphen
  let cleaned = nickname.replace(/[^a-zA-Z0-9_-]/g, '');
  
  // Ensure it starts with a letter or number
  if (!/^[a-zA-Z0-9]/.test(cleaned)) {
    cleaned = 'user' + cleaned.replace(/^[_-]+/, '');
  }
  
  // Limit length (2-20 characters)
  if (cleaned.length < 2) {
    cleaned = cleaned + '1';
  }
  if (cleaned.length > 20) {
    cleaned = cleaned.substring(0, 20);
  }
  
  return cleaned;
}

/**
 * Validate a nickname format
 * @param {string} nickname - Nickname to validate
 * @returns {Object} - Validation result with isValid and errors
 */
export function validateNickname(nickname) {
  const errors = [];
  
  if (!nickname || typeof nickname !== 'string') {
    errors.push('Nickname is required');
    return { isValid: false, errors };
  }
  
  if (nickname.length < 2) {
    errors.push('Nickname must be at least 2 characters long');
  }
  
  if (nickname.length > 20) {
    errors.push('Nickname must be no more than 20 characters long');
  }
  
  if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]*$/.test(nickname)) {
    errors.push('Nickname can only contain letters, numbers, underscores, and hyphens, and must start with a letter or number');
  }
  
  // Check for reserved names
  const reservedNames = ['admin', 'root', 'system', 'guest', 'anonymous', 'null', 'undefined'];
  if (reservedNames.includes(nickname.toLowerCase())) {
    errors.push('This nickname is reserved and cannot be used');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
} 