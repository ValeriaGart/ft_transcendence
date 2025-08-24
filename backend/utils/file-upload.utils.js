import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration for uploads
const UPLOAD_CONFIG = {
  AVATAR: {
    ALLOWED_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
    MAX_SIZE: 10 * 1024 * 1024, // 10MB limit
    UPLOAD_DIR: path.resolve(__dirname, '../../public/uploads/avatars')
  }
};

/**
 * Validate uploaded file
 */
export function validateFile(file, type) {
  const config = UPLOAD_CONFIG[type];
  if (!config) {
    return { valid: false, errors: ['Invalid file type'] };
  }

  const errors = [];

  // Check if file exists
  if (!file) {
    errors.push('No file provided');
    return { valid: false, errors };
  }

  // Check file type
  if (!file.mimetype || !config.ALLOWED_TYPES.includes(file.mimetype)) {
    errors.push(`File type ${file.mimetype || 'unknown'} not allowed. Allowed types: ${config.ALLOWED_TYPES.join(', ')}`);
  }

  // Check if file has content
  if (!file.file) {
    errors.push('File is empty or corrupted');
  }

  // Check file size
  if (file.file && file.file.bytesRead > config.MAX_SIZE) {
    errors.push(`File size exceeds maximum allowed size of ${config.MAX_SIZE / (1024 * 1024)}MB`);
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Generate unique filename
 */
export function generateUniqueFilename(originalFilename, userId) {
  const timestamp = Date.now();
  const randomString = crypto.randomBytes(8).toString('hex');
  const extension = path.extname(originalFilename);
  const baseName = path.basename(originalFilename, extension);
  
  return `${userId}_${baseName}_${timestamp}_${randomString}${extension}`;
}

/**
 * Save uploaded file to disk
 */
export async function saveFile(file, filename, type) {
  const config = UPLOAD_CONFIG[type];
  
  // Ensure upload directory exists
  await fs.mkdir(config.UPLOAD_DIR, { recursive: true });
  
  const filePath = path.join(config.UPLOAD_DIR, filename);
  
  try {
    // Read the file buffer and save it
    const buffer = await file.toBuffer();
    await fs.writeFile(filePath, buffer);
    
    return filePath;
  } catch (error) {
    throw new Error('Failed to save file to disk');
  }
}

/**
 * Delete file from disk
 */
export async function deleteFile(filePath) {
  try {
    await fs.unlink(filePath);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Get public URL for file
 */
export function getFileUrl(filePath) {
  // Extract just the uploads/avatars/filename part from the full path
  const uploadsIndex = filePath.indexOf('uploads');
  if (uploadsIndex !== -1) {
    const uploadsPath = filePath.substring(uploadsIndex);
    return `/${uploadsPath.replace(/\\/g, '/')}`;
  }
  
  // Fallback: return the filename only
  const filename = path.basename(filePath);
  return `/uploads/avatars/${filename}`;
}

/**
 * Clean up old avatar files for a user
 */
export async function cleanupOldAvatars(userId, currentAvatarUrl) {
  try {
    const config = UPLOAD_CONFIG.AVATAR;
    const files = await fs.readdir(config.UPLOAD_DIR);
    
    for (const file of files) {
      if (file.startsWith(`${userId}_`) && !file.includes(path.basename(currentAvatarUrl))) {
        const filePath = path.join(config.UPLOAD_DIR, file);
        await deleteFile(filePath);
      }
    }
  } catch (error) {
    // Silently fail cleanup - not critical
  }
}
