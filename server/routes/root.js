'use strict'

module.exports = async function (fastify, opts) {
  fastify.get('/', async function (request, reply) {
    reply .code(200)
    .send (`hello world\n${JSON.stringify(process.env, null, 2)}`)
  })
}
