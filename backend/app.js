// Add this to the VERY top of the first file loaded in your app
/* import apmInit from 'elastic-apm-node';
const apm = apmInit.start({
  // Override service name from package.json
  // Allowed characters: a-z, A-Z, 0-9, -, _, and space
  serviceName: 'apm',

  // Use if APM Server requires a token
  secretToken: '',

  // Use if APM Server uses API keys for authentication
  apiKey: '',

  // Set custom APM Server URL (default: http://127.0.0.1:8200)
  serverUrl: 'http://0.0.0.0:8200',
})
 */

import { config } from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load environment variables FIRST, before other imports
config({ path: path.resolve('../.env') });

import fastify from 'fastify';
import { initialize } from './config/database.js';
import userRoutes from './routes/user.routes.js';
import profileRoutes from './routes/profile.routes.js';
import friendRoutes from './routes/friend.routes.js';
import matchRoutes from './routes/match.routes.js';
import authRoutes from './routes/auth.routes.js';
import websocketRoutes from './routes/websocket.routes.js';
import authPlugin from './plugins/auth.js';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';

import ws from '@fastify/websocket';

// Simple SSL configuration
function getSSLOptions() {
  const sslEnabled = process.env.SSL_ENABLED === 'true';
  
  if (!sslEnabled) {
    return null;
  }
  
  const certPath = path.resolve('../ssl/server.crt');
  const keyPath = path.resolve('../ssl/server.key');
  
  try {
    if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
      return {
        key: fs.readFileSync(keyPath),
        cert: fs.readFileSync(certPath)
      };
    } else {
      console.log('⚠️  SSL enabled but certificates not found. Run: ../scripts/generate-ssl.sh');
      return null;
    }
  } catch (error) {
    console.log('❌ Failed to load SSL certificates:', error.message);
    return null;
  }
}

const sslOptions = getSSLOptions();
const fastifyOptions = { logger: true };

if (sslOptions) {
  fastifyOptions.https = sslOptions;
  console.log('🔒 SSL enabled');
} else {
  console.log('🌐 HTTP only');
}

const app = fastify(fastifyOptions);

// register websocket
await app.register(ws)

// Register cookie plugin
await app.register(cookie, {
  secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-here-let-us-make-it-long-and-random'
});

// Register CORS
await app.register(cors, {
  origin: true,
  methods: ['GET', 'PUT', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  credentials: true
});

// Register auth plugin
await app.register(authPlugin);

// Global rate limiting with sensible defaults
await app.register(import('@fastify/rate-limit'), {
  global: true,
  max: 1000,
  timeWindow: '15 minutes',
  // Allow route-specific overrides
  allowList: ['127.0.0.1'], // Optional: whitelist localhost for development
  skipOnError: false
});

// Register routes
await app.register(authRoutes);
await app.register(userRoutes);
await app.register(profileRoutes);
await app.register(friendRoutes);
await app.register(matchRoutes);
await app.register(websocketRoutes);

async function bootstrap() {
  try {
    await initialize();
    
    const port = sslOptions ? (process.env.HTTPS_PORT || 3443) : (process.env.HTTP_PORT || 3000);
    const protocol = sslOptions ? 'https' : 'http';
    
    await app.listen({ port, host: '0.0.0.0' });
    
    console.log(`🚀 Server running on ${protocol}://localhost:${port}`);
    
    if (sslOptions) {
      console.log('🔐 HTTPS enabled with self-signed certificate');
      console.log('⚠️  Browsers will show security warnings for development certificates');
    }
    
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

bootstrap();