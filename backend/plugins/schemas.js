// schemas.js

////////////////////////////////////


// this file is not used at the moment, but I upload it to keep it in my mind


////////////////////////////////////

















// const { default: fastify } = require("fastify");

/**
 * Encapsulates the routes
 * @param {FastifyInstance} fastify  Encapsulated Fastify Instance
 * @param {Object} options plugin options, refer to https://fastify.dev/docs/latest/Reference/Plugins/#plugin-options
 */

// fastify.register(require('@fastify/ajv-compiler'));
// fastify.addSchema({
// 	$id: 'userBodySchema',
// 	required: ['email', 'passwordString'],
// 	type: 'object',
// 	properties: {
// 		email: { type: 'string', format: 'email' },
// 		passwordString: { type: 'string', minLength: 6 }
// 	}
// }
// );



const userBodySchema = {
  type: 'object',
  required: ['email', 'passwordString'],
  properties: {
    email: { type: 'string', format: 'email' },
    passwordString: { type: 'string', minLength: 6 }
  }
};