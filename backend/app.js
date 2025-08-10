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
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables FIRST, before other imports
config({ path: path.resolve(__dirname, '../.env') });

import fastify from 'fastify';
import { initialize } from './config/database.js';
import getSSLOptions from './config/ssl.config.js';
import userRoutes from './routes/user.routes.js';
import profileRoutes from './routes/profile.routes.js';
import friendRoutes from './routes/friend.routes.js';
import matchRoutes from './routes/match.routes.js';
import authRoutes from './routes/auth.routes.js';
import websocketRoutes from './routes/websocket.routes.js';
import healthRoutes from './routes/health.routes.js';
import authPlugin from './plugins/auth.js';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import ws from '@fastify/websocket';
import log_it, { setLoggerApp } from './utils/logger.utils.js';

// Initialize SSL configuration
const sslOptions = getSSLOptions();

// // logging setup
const fastifyOptions = {
  logger: {
    level: process.env.LOG_LEVEL,
    transport: {
      target: 'pino/file',
      options: { destination: 'logs_backend/app.log' }
    }
  }
};

if (sslOptions) {
  fastifyOptions.https = sslOptions;
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
await app.register(healthRoutes);

setLoggerApp(app);
log_it('DEBUGGING message blablabla', "debug");
log_it('INFOING message blablabla', "info");
log_it('WARNING message blablabla', "warn");
log_it('ERRORING message blablabla', "error");

async function bootstrap() {
  try {
    await initialize();
    
    const port = sslOptions ? (process.env.HTTPS_PORT || 3443) : (process.env.HTTP_PORT || 3000);
    const protocol = sslOptions ? 'https' : 'http';
    
    await app.listen({ port, host: '0.0.0.0' });
    
    log_it(`🚀 Server running on ${protocol}://localhost:${port}`, "info");
    
    if (sslOptions) {
      log_it('🔐 HTTPS enabled with self-signed certificate', "info");
      log_it('⚠️  Browsers will show security warnings for development certificates', "info");
    }
    
  } catch (err) {
    log_it(err, "error");
    process.exit(1);
  }
}

bootstrap();