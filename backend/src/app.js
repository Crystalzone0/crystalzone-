import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import mongoSanitize from 'express-mongo-sanitize';

import { env } from './config/env.js';
import apiRouter from './routes/index.js';
import seoRoutes from './routes/seoRoutes.js';
import { renderPage } from './controllers/pageController.js';
import { apiLimiter } from './middleware/rateLimiters.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';

const app = express();

// Behind Render/Railway/Nginx the real client IP arrives in X-Forwarded-For.
// Required for correct rate limiting and secure cookies in production.
if (env.isProd) app.set('trust proxy', 1);
app.disable('x-powered-by');

const httpsSite = env.APP_URL.startsWith('https://');

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    hsts: httpsSite,
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        'default-src': ["'self'"],
        'script-src': ["'self'"],
        'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        'font-src': ["'self'", 'https://fonts.gstatic.com', 'data:'],
        'img-src': ["'self'", 'data:', 'blob:', 'https://res.cloudinary.com'],
        'connect-src': ["'self'"],
        'object-src': ["'none'"],
        'frame-ancestors': ["'self'"],
        // Only force https when the site itself is served over https.
        'upgrade-insecure-requests': httpsSite ? [] : null,
      },
    },
  })
);

app.use(
  cors({
    origin: [env.CLIENT_URL, env.APP_URL],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  })
);

app.use(compression());
if (!env.isTest) app.use(morgan(env.isProd ? 'combined' : 'dev'));

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());
app.use(mongoSanitize()); // strips $ and . operators from body/query/params (NoSQL injection)

// ---------- API ----------
app.use('/api', apiLimiter);
app.use('/api', apiRouter);
app.use('/api', notFound); // unknown API paths return JSON 404, never the React app

// ---------- Search engine files: /sitemap.xml and /robots.txt (these also work in development, on the API port) ----------
app.use(seoRoutes);

// ---------- Frontend (production: one service serves API + built React app) ----------
if (env.isProd && fs.existsSync(path.join(env.distPath, 'index.html'))) {
  app.use(
    '/assets',
    express.static(path.join(env.distPath, 'assets'), { index: false, immutable: true, maxAge: '1y' })
  );
  app.use(express.static(env.distPath, { index: false, maxAge: '1h' }));

  // Every page gets its own title and tags; unknown pages answer 404; private pages send noindex.
  app.get('*', renderPage);
}

app.use(notFound);
app.use(errorHandler);

export default app;