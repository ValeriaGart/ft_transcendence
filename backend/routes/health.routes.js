async function routes(fastify, options) {
	fastify.get('/health', async (request, reply) => {
		return { status: 'ok' };
	});
}

export default routes;
