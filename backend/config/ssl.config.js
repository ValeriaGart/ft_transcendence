import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Get SSL options for Fastify server
 * @returns {Object|null} SSL options object or null if SSL is disabled
 */
function getSSLOptions() {
  const sslEnabled = process.env.SSL_ENABLED === 'true';
  
  if (!sslEnabled) {
    console.log('🌐 SSL disabled - running in HTTP mode');
    return null;
  }
  
  const certPath = path.resolve(__dirname, '../ssl/server.crt');
  const keyPath = path.resolve(__dirname, '../ssl/server.key');
  
  try {
    // Read files directly - if they don't exist, fs.readFileSync will throw
    const key = fs.readFileSync(keyPath);
    const cert = fs.readFileSync(certPath);
    
    console.log('🔒 SSL enabled');
    return { key, cert };
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log('\n❌ SSL certificates not found! Run: ./backend/scripts/generate-ssl.sh\n');
      console.log('   Or set SSL_ENABLED=false in .env for HTTP mode');
    } else {
      console.log('\n❌ SSL error:', error.message);
    }
    console.log('🛑 Stopping server...\n');
    process.exit(1);
  }
}

export default getSSLOptions;
