import mongoose from 'mongoose';
import app from './app.js';
import { env } from './config/env.js';
import { connectDB } from './config/db.js';

async function start() {
  await connectDB();

  const server = app.listen(env.PORT, () => {
    console.log(`Crystal Zone API running on port ${env.PORT} (${env.NODE_ENV})`);
    if (!env.cloudinaryConfigured) {
      console.warn('Cloudinary is not configured: admin image upload is disabled until you set it in .env');
    }
    if (!env.smtpConfigured) {
      console.warn('SMTP is not configured: emails will be skipped (the store still works)');
    }
  });

  const shutdown = (signal) => {
    console.log(`\n${signal} received: shutting down gracefully`);
    server.close(async () => {
      await mongoose.connection.close();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000).unref();
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

// After an unexpected error the process may be in an unknown state: log it and exit,
// and your host (Render, Railway, PM2, Docker ...) starts a clean copy.
process.on('unhandledRejection', (err) => {
  console.error('Unhandled rejection:', err);
  process.exit(1);
});
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
  process.exit(1);
});

start().catch((err) => {
  console.error(`\nFailed to start server: ${err.message}\n`);
  process.exit(1);
});