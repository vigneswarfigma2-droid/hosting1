import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { config, assertReady } from './config.js';
import { logger } from './lib/logger.js';
import paymentRoutes from './routes/payment.js';

try {
    assertReady();
} catch (err) {
    logger.error(err.message);
    process.exit(1);
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');
const DIST_DIR = path.resolve(PROJECT_ROOT, 'dist');

const app = express();
app.set('trust proxy', 1); // honor X-Forwarded-* behind a reverse proxy

// ─── Security middleware ───
app.use(
    helmet({
        // The frontend loads from Vite at a different origin in dev; CSP is
        // best applied at the static host (Vite/Nginx). Disable here so the
        // API doesn't accidentally block legitimate cross-origin requests.
        contentSecurityPolicy: false,
        crossOriginEmbedderPolicy: false,
        crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
);
app.use(compression());

// ─── CORS ───
app.use(
    cors({
        origin: (origin, cb) => {
            // No origin = same-origin request or curl. Allow.
            if (!origin) return cb(null, true);
            if (config.corsOrigins.length === 0) return cb(null, true);
            if (config.corsOrigins.includes(origin)) return cb(null, true);
            logger.warn('CORS blocked origin:', origin);
            return cb(new Error(`Origin ${origin} not allowed by CORS`));
        },
        credentials: true,
    })
);

// ─── Logging ───
morgan.token('rid', (req) => req.id || '-');
app.use(
    morgan(
        config.env === 'development'
            ? ':method :url :status :res[content-length] - :response-time ms'
            : 'combined',
        { stream: { write: (msg) => logger.info(msg.trim()) } }
    )
);

// ─── Body parsing ───
// The webhook route mounts its own express.raw, so we MUST register the
// global JSON parser only for non-webhook routes.
app.use((req, res, next) => {
    if (req.originalUrl === '/api/payment/webhook') return next();
    express.json({ limit: '32kb' })(req, res, next);
});
app.use(express.urlencoded({ extended: false, limit: '32kb' }));

// ─── Health check ───
app.get('/api/health', (_req, res) => {
    res.json({ ok: true, env: config.env, ts: new Date().toISOString() });
});

// ─── API routes ───
app.use('/api/payment', paymentRoutes);

// ─── Optional: serve the static site from this same server in production ───
// Comment out the next block if you serve the frontend separately (Nginx, Netlify, etc).
if (config.env !== 'development') {
    app.use(
        express.static(DIST_DIR, {
            index: 'index.html',
            extensions: ['html'],
            maxAge: '1h',
        })
    );
    // SPA-ish fallback: any unmatched GET that doesn't start with /api → 404.html
    app.get('*', (req, res, next) => {
        if (req.path.startsWith('/api/')) return next();
        res.status(404).sendFile(path.join(DIST_DIR, '404.html'));
    });
}

// ─── 404 + error handlers ───
app.use((req, res) => {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: `No handler for ${req.method} ${req.path}` } });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, _next) => {
    logger.error('Unhandled error:', err);
    res.status(err.status || 500).json({
        error: {
            code: err.code || 'INTERNAL_ERROR',
            message: config.env === 'development' ? err.message : 'Something went wrong.',
        },
    });
});

const server = app.listen(config.port, () => {
    logger.info(`Fraylon API listening on http://localhost:${config.port}  (env=${config.env})`);
    logger.info(`CORS origins: ${config.corsOrigins.join(', ') || '(all)'}`);
    logger.info(`Razorpay keyId: ${config.razorpay.keyId.slice(0, 12)}…`);
});

// Graceful shutdown
for (const sig of ['SIGINT', 'SIGTERM']) {
    process.on(sig, () => {
        logger.info(`${sig} received, shutting down…`);
        server.close(() => process.exit(0));
        setTimeout(() => process.exit(1), 10000).unref();
    });
}
