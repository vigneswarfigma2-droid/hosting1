import { config } from '../config.js';

const LEVELS = { debug: 10, info: 20, warn: 30, error: 40 };
const threshold = LEVELS[config.logLevel] ?? LEVELS.info;

function log(level, ...args) {
    if (LEVELS[level] < threshold) return;
    const ts = new Date().toISOString();
    const tag = `[${ts}] [${level.toUpperCase()}]`;
    const fn = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
    fn(tag, ...args);
}

export const logger = {
    debug: (...a) => log('debug', ...a),
    info: (...a) => log('info', ...a),
    warn: (...a) => log('warn', ...a),
    error: (...a) => log('error', ...a),
};

/**
 * Scrub sensitive fields from objects before logging.
 * Razorpay signatures and key secrets must never end up in logs.
 */
export function redact(obj) {
    if (!obj || typeof obj !== 'object') return obj;
    const SENSITIVE = ['key_secret', 'keySecret', 'signature', 'razorpay_signature', 'password', 'authorization'];
    const out = Array.isArray(obj) ? [] : {};
    for (const [k, v] of Object.entries(obj)) {
        if (SENSITIVE.some((s) => k.toLowerCase().includes(s.toLowerCase()))) {
            out[k] = '***';
        } else if (v && typeof v === 'object') {
            out[k] = redact(v);
        } else {
            out[k] = v;
        }
    }
    return out;
}
