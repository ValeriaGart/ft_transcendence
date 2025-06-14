import fastify from 'fastify';
import { db, initialize } from './plugins/db-connector.js';
import routesUser from './plugins/route-users.js';
import routesProfiles from './plugins/route-profiles.js';

const app = fastify({ logger: true });
app.register(routesUser);
app.register(routesProfiles);

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