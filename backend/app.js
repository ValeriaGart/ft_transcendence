import fastify from 'fastify';
import { db, initialize } from './plugins/db-connector.js';
import routes from './plugins/route-users.js';

const app = fastify({ logger: true });
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