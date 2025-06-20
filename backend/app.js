import fastify from 'fastify';
import { initialize } from './config/database.js';
import userRoutes from './routes/user.routes.js';
import profileRoutes from './routes/profile.routes.js';
import cors from '@fastify/cors';

const app = fastify({ logger: true });

// Register CORS
app.register(cors, {
  origin: true,
  methods: ['GET', 'PUT', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  credentials: true
});

// Register routes
app.register(userRoutes);
app.register(profileRoutes);

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