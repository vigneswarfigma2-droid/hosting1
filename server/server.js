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
import chatbotRoutes from './routes/chatbot.js';

try {
    assertReady();
} catch (err) {
    logger.error(err.message);
    process.exit(1);
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_DIR = path.resolve(__dirname, '../dist');

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
    cors((req, callback) => {
        const origin = req.header('Origin');
        const requestHost = req.get('host');
        let allow = false;

        if (!origin) {
            allow = true;
        } else {
            try {
                const url = new URL(origin);
                const hostname = url.hostname;

                if (
                    // Same-origin (e.g., frontend and API served on same domain)
                    hostname === requestHost ||
                    // Explicitly allowed in config
                    config.corsOrigins.includes(origin) ||
                    // Fraylon Hosting domains
                    hostname === 'fraylonhosting.com' ||
                    hostname.endsWith('.fraylonhosting.com') ||
                    // Local dev
                    hostname === 'localhost' ||
                    hostname === '127.0.0.1' ||
                    // Railway staging/deployment domains
                    hostname.endsWith('.railway.app')
                ) {
                    allow = true;
                } else {
                    logger.warn('CORS blocked origin:', origin);
                }
            } catch (err) {
                logger.warn('CORS failed to parse origin:', origin, err.message);
            }
        }

        callback(null, {
            origin: allow,
            credentials: true,
        });
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
app.use('/api/chatbot', chatbotRoutes);

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
        res.sendFile(path.join(DIST_DIR, 'index.html'));
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
