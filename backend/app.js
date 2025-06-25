import fastify from 'fastify';
import { initialize } from './config/database.js';
import userRoutes from './routes/user.routes.js';
import profileRoutes from './routes/profile.routes.js';
import authPlugin from './plugins/auth.js';
import cors from '@fastify/cors';
import 'dotenv/config';

const app = fastify({ logger: true });

// Register CORS
await app.register(cors, {
  origin: true,
  methods: ['GET', 'PUT', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  credentials: true
});

// Register auth plugin
await app.register(authPlugin);

// Global rate limiting
await app.register(import('@fastify/rate-limit'), {
  max: 1000,
  timeWindow: '15 minutes'
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