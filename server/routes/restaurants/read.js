'use strict'

const { readRestaurants } = require('../../model')
const { readReviews } = require('../../model')

module.exports = async function (fastify, opts) {
  fastify.get('/', async function (request, reply) {
    const result = await readRestaurants(this.mongo)
    reply
    .code(200)
    .header('Content-Type', 'application/json')
    .send(result);
  })

  fastify.get('/:id/reviews', async function (request, reply) {
      const result = await readReviews(this.mongo, request.params.id)
      reply
      .code(200)
      .header('Content-Type', 'application/json')
      .send(result);
  })
}