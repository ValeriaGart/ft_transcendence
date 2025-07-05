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