import { config } from 'dotenv';
import path from 'path';

// Load environment variables FIRST, before other imports
config({ path: path.resolve('../.env') });

import fastify from 'fastify';
import { initialize } from './config/database.js';
import userRoutes from './routes/user.routes.js';
import profileRoutes from './routes/profile.routes.js';
import authPlugin from './plugins/auth.js';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';

const app = fastify({ logger: true });

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
await app.register(userRoutes);
await app.register(profileRoutes);


async function bootstrap() {
  try {
    await initialize();
    await app.listen({ port: 3000, host: '0.0.0.0' });
    app.log.info('Server running on http://localhost:3000');
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

bootstrap();