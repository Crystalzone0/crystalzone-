import mongoose from 'mongoose';
import { env } from './env.js';

mongoose.set('strictQuery', true);

export async function connectDB() {
  try {
    await mongoose.connect(env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
    if (!env.isTest) {
      console.log(`MongoDB connected: ${mongoose.connection.host}/${mongoose.connection.name}`);
    }
  } catch (err) {
    throw new Error(
      `Could not connect to MongoDB (${err.message}). ` +
        'Check MONGODB_URI in your .env file and make sure MongoDB is running.'
    );
  }

  mongoose.connection.on('error', (err) => console.error('MongoDB error:', err.message));
  mongoose.connection.on('disconnected', () => console.warn('MongoDB disconnected'));
}

export async function disconnectDB() {
  await mongoose.connection.close();
}