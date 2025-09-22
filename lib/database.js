const mongoose = require('mongoose');
const config = require('../config');

let cached = global.__easyformMongoose;

if (!cached) {
  cached = global.__easyformMongoose = { conn: null, promise: null };
}

async function connectToDatabase() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    mongoose.set('strictQuery', false);

    cached.promise = mongoose
      .connect(config.database.uri, {
        dbName: config.database.name,
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
      })
      .then((mongooseInstance) => {
        return mongooseInstance.connection;
      })
      .catch((error) => {
        cached.promise = null;
        throw error;
      });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

module.exports = {
  connectToDatabase,
  mongoose,
};
