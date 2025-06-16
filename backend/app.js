import fastify from 'fastify';
import { db, initialize } from './plugins/db-connector.js';
import routesUser from './plugins/route-users.js';
import routesProfiles from './plugins/route-profiles.js';

//sugested by ai
import cors from '@fastify/cors';

const app = fastify({ logger: true });

app.register(routesUser);
app.register(routesProfiles);

// Register CORS  sugested by ai
app.register(cors, {
  origin: true, // Allow all origins in development
  methods: ['GET', 'PUT', 'POST', 'DELETE', 'OPTIONS'],
  credentials: true
});



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