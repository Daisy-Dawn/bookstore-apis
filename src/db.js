require('dotenv').config() // Load .env variables

const { MongoClient } = require('mongodb')

const MONGODB_URI = process.env.MONGODB_URI

let dbCollection

module.exports = {
    connectToDb: (cb) => {
        MongoClient.connect(MONGODB_URI)
            .then((client) => {
                // Connect to the specified database (bookstore)
                dbCollection = client.db('bookstore')
                return cb()
            })
            .catch((err) => {
                console.error(err)
                return cb(err)
            })
    },
    getDb: () => dbCollection,
}
