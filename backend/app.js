import fastify from 'fastify';
import { db, initialize } from './plugins/db-connector.js';
import routes from './plugins/route-users.js';

//sugested by ai
import cors from '@fastify/cors';

const app = fastify({ logger: true });

// Register CORS  sugested by ai
app.register(cors, {
  origin: true, // Allow all origins in development
  methods: ['GET', 'PUT', 'POST', 'DELETE', 'OPTIONS'],
  credentials: true
});


app.register(routes);

async function bootstrap() {
  try {
    await initialize();
    await app.listen({ port: 3000 });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}
bootstrap();