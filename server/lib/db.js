/**
 * Tiny JSON-on-disk store.
 *
 * Why not SQLite/Postgres? Because we want zero-native-dependency setup
 * on Windows + Mac + Linux. This module exposes the SAME named API as a
 * SQL-backed implementation would (`orderRepo.create/findById/setStatus`,
 * `paymentRepo.record/listForOrder`) so swapping it later is a one-file
 * change.
 *
 * Durability strategy:
 *  - Each write rewrites the index file via temp-file + rename (atomic
 *    on Windows/POSIX).
 *  - Each successful write is also appended to an audit log (append-only)
 *    so we can replay/recover if the index is ever corrupted.
 *
 * Concurrency strategy:
 *  - Express is single-threaded; route handlers serialize per request.
 *  - All writes go through `mutate()` which holds a per-process Promise
 *    chain so concurrent requests can't tear the JSON file.
 *
 * Capacity: fine to a few thousand orders. If you cross ~50k orders or
 * need multi-process workers, swap this file for Postgres.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { logger } from './logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, '..', 'data');
const INDEX_PATH = path.join(DATA_DIR, 'fraylon.json');
const AUDIT_PATH = path.join(DATA_DIR, 'fraylon.audit.log');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

function load() {
    try {
        const raw = fs.readFileSync(INDEX_PATH, 'utf8');
        const j = JSON.parse(raw);
        return { orders: j.orders || {}, payments: j.payments || {} };
    } catch (err) {
        if (err.code !== 'ENOENT') logger.warn('db load: starting fresh —', err.message);
        return { orders: {}, payments: {} };
    }
}

let state = load();
logger.info('JSON store ready at', INDEX_PATH, `(${Object.keys(state.orders).length} orders loaded)`);

// Atomic save: write to .tmp then rename.
function atomicWrite(filepath, data) {
    const tmp = filepath + '.tmp';
    fs.writeFileSync(tmp, data, 'utf8');
    fs.renameSync(tmp, filepath);
}

function appendAudit(entry) {
    fs.appendFileSync(AUDIT_PATH, JSON.stringify({ ts: new Date().toISOString(), ...entry }) + '\n', 'utf8');
}

// Serialize concurrent writes through a single Promise chain.
let _writeLock = Promise.resolve();
function mutate(fn) {
    const next = _writeLock.then(async () => {
        try {
            const result = fn();
            atomicWrite(INDEX_PATH, JSON.stringify(state, null, 2));
            return result;
        } catch (err) {
            logger.error('db mutate failed', err);
            throw err;
        }
    });
    _writeLock = next.catch(() => {}); // don't break the chain on error
    return next;
}

function nowIso() {
    return new Date().toISOString().replace('T', ' ').slice(0, 19);
}

// ─────────────────── orderRepo ───────────────────
export const orderRepo = {
    create(order) {
        const row = {
            id: order.id,
            receipt: order.receipt,
            plan_id: order.planId,
            duration_months: order.durationMonths,
            amount_paise: order.amountPaise,
            currency: order.currency,
            status: order.status || 'created',
            customer_email: order.customerEmail || null,
            customer_name: order.customerName || null,
            notes: order.notes || null,
            created_at: nowIso(),
            updated_at: nowIso(),
        };
        mutate(() => {
            state.orders[row.id] = row;
            appendAudit({ event: 'order.create', id: row.id, plan: row.plan_id, amount: row.amount_paise });
        });
        return hydrateOrder(row);
    },
    findById(id) {
        const row = state.orders[id];
        return row ? hydrateOrder(row) : null;
    },
    findByReceipt(receipt) {
        const row = Object.values(state.orders).find((o) => o.receipt === receipt);
        return row ? hydrateOrder(row) : null;
    },
    setStatus(id, status) {
        const row = state.orders[id];
        if (!row) return;
        mutate(() => {
            row.status = status;
            row.updated_at = nowIso();
            appendAudit({ event: 'order.status', id, status });
        });
    },
};

// ─────────────────── paymentRepo ───────────────────
export const paymentRepo = {
    record(payment) {
        const row = {
            id: payment.id,
            order_id: payment.orderId,
            signature: payment.signature || null,
            status: payment.status,
            method: payment.method || null,
            amount_paise: payment.amountPaise,
            currency: payment.currency,
            error_code: payment.errorCode || null,
            error_description: payment.errorDescription || null,
            raw: payment.raw || null,
            created_at: nowIso(),
        };
        mutate(() => {
            // INSERT OR REPLACE
            state.payments[row.id] = row;
            appendAudit({ event: 'payment.record', id: row.id, order: row.order_id, status: row.status });
        });
    },
    listForOrder(orderId) {
        return Object.values(state.payments)
            .filter((p) => p.order_id === orderId)
            .sort((a, b) => a.created_at.localeCompare(b.created_at))
            .map(hydratePayment);
    },
};

function hydrateOrder(row) {
    return {
        id: row.id,
        receipt: row.receipt,
        planId: row.plan_id,
        durationMonths: row.duration_months,
        amountPaise: row.amount_paise,
        currency: row.currency,
        status: row.status,
        customerEmail: row.customer_email,
        customerName: row.customer_name,
        notes: row.notes,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

function hydratePayment(row) {
    return {
        id: row.id,
        orderId: row.order_id,
        status: row.status,
        method: row.method,
        amountPaise: row.amount_paise,
        currency: row.currency,
        errorCode: row.error_code,
        errorDescription: row.error_description,
        createdAt: row.created_at,
    };
}
