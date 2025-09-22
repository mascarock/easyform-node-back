import mongoose from 'mongoose'
import config from '../config/index.js'

let connectionPromise: Promise<typeof mongoose> | null = null
let listenersRegistered = false

export async function connectToDatabase(): Promise<typeof mongoose> {
  if (connectionPromise) {
    return connectionPromise
  }

  connectionPromise = mongoose.connect(config.database.uri, {
    dbName: config.database.name,
    maxPoolSize: 10,
  })

  if (!listenersRegistered) {
    listenersRegistered = true

    mongoose.connection.on('connected', () => {
      console.log('MongoDB connected')
    })

    mongoose.connection.on('error', (error) => {
      console.error('MongoDB connection error', error)
      connectionPromise = null
    })

    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected')
      connectionPromise = null
    })
  }

  return connectionPromise
}

export function getConnectionState(): number {
  return mongoose.connection.readyState
}
