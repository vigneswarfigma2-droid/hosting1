import 'dotenv/config';

function required(name) {
    const v = process.env[name];
    if (!v || !v.trim()) {
        // Don't crash the process here — let server.js print a clean error.
        return null;
    }
    return v.trim();
}

export const config = {
    env: process.env.NODE_ENV || 'development',
    port: Number(process.env.PORT) || 4242,
    logLevel: process.env.LOG_LEVEL || 'info',

    razorpay: {
        keyId: required('RAZORPAY_KEY_ID'),
        keySecret: required('RAZORPAY_KEY_SECRET'),
        webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || null,
    },

    corsOrigins: (process.env.CORS_ORIGINS || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),

    publicBaseUrl: process.env.PUBLIC_BASE_URL || 'http://localhost:5173',
    defaultCurrency: process.env.DEFAULT_CURRENCY || 'INR',
    gstPercent: Number(process.env.GST_PERCENT) || 18,
};

export function assertReady() {
    const missing = [];
    if (!config.razorpay.keyId) missing.push('RAZORPAY_KEY_ID');
    if (!config.razorpay.keySecret) missing.push('RAZORPAY_KEY_SECRET');
    if (missing.length) {
        throw new Error(
            `Missing required env vars: ${missing.join(', ')}. ` +
                `Copy .env.example to .env and fill them in.`
        );
    }
}
