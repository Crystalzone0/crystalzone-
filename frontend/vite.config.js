import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';
import tailwindConfig from './tailwind.config.js';

const here = path.dirname(fileURLToPath(import.meta.url));
// Absolute, forward-slash globs: they work whatever folder Vite is started from, and on Windows.
const glob = (p) => path.join(here, p).replace(/\\/g, '/');

// The single .env lives in the project root (one level up).
// Only variables prefixed with VITE_ are exposed to browser code.
export default defineConfig({
  plugins: [react()],
  envDir: '..',
  // Tailwind is set up here, so styling no longer depends on Vite finding a separate postcss.config.js.
  css: {
    postcss: {
      plugins: [
        tailwindcss({ ...tailwindConfig, content: [glob('index.html'), glob('src/**/*.{js,jsx}')] }),
        autoprefixer(),
      ],
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          query: ['@tanstack/react-query', 'axios'],
          charts: ['recharts'],
        },
      },
    },
  },
});