import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.js'],
    testTimeout: 30_000,
    hookTimeout: 180_000, // the first run downloads a MongoDB binary for the in-memory test database
    fileParallelism: false, // one test database at a time
    // Fixed settings so the tests behave the same on every computer, whatever is in your real .env file.
    // MONGODB_URI points nowhere on purpose: the tests use their own in-memory database, so even a
    // mistake in a test can never reach your real data.
    env: {
      NODE_ENV: 'test',
      MONGODB_URI: 'mongodb://127.0.0.1:1/never-used-in-tests',
      JWT_SECRET: 'test-secret-test-secret-test-secret-1234567890',
      APP_URL: 'http://localhost:5173',
      CLIENT_URL: 'http://localhost:5173',
      CURRENCY: 'PKR',
      SHIPPING_FEE: '250',
      FREE_SHIPPING_THRESHOLD: '5000',
      LOW_STOCK_THRESHOLD: '5',
      CLOUDINARY_CLOUD_NAME: '',
      CLOUDINARY_API_KEY: '',
      CLOUDINARY_API_SECRET: '',
      SMTP_HOST: '',
      SMTP_USER: '',
      SMTP_PASS: '',
    },
  },
});