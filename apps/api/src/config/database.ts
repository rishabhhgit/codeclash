import mongoose from 'mongoose';
import { config } from './index';

const globalForMongoose = globalThis as unknown as {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose | null> | null;
};

mongoose.set('bufferCommands', false);

export async function connectDatabase(): Promise<typeof mongoose | null> {
  if (globalForMongoose.conn) {
    return globalForMongoose.conn;
  }

  if (!globalForMongoose.promise) {
    globalForMongoose.promise = mongoose
      .connect(config.mongodbUri, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 3000,
      })
      .then((conn) => {
        console.log('MongoDB connected successfully');
        return conn;
      })
      .catch((err) => {
        console.warn('MongoDB connection failed or offline:', err.message);
        console.warn('Running API server in memory / standalone mode');
        return null;
      });
  }

  globalForMongoose.conn = await globalForMongoose.promise;
  return globalForMongoose.conn;
}

export { mongoose };
