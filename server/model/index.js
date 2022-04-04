const { ObjectId } = require('fastify-mongodb')

module.exports = {
    readRestaurants: async (mongo) => {
      const collection = mongo.db.collection('restaurants')
      const result = await collection.find({}).toArray()
      return result
    },
    readReviews: async (mongo, id) => {
      const collection = mongo.db.collection('restaurants')
      const result = await collection.find({
        _id: ObjectId(id)
      }).toArray()
      return result
    }
}