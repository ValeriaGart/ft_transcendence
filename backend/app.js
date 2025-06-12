// CommonJs
/**
 * @type {import('fastify').FastifyInstance} Instance of Fastify
 */
const fastify = require('fastify')({
  logger: true
})

const { db, initialize } = require('./plugins/our-db-route');

fastify.register(require('./plugins/our-first-route'))






async function bootstrap() {
  try {
    await initialize();
    await fastify.listen({ port: 3000 });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}
bootstrap();