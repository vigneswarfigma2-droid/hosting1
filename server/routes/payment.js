import express from 'express';
import rateLimit from 'express-rate-limit';
import crypto from 'node:crypto';

import { config } from '../config.js';
import { logger, redact } from '../lib/logger.js';
import { priceFor, PricingError } from '../lib/plans.js';
import { orderRepo, paymentRepo } from '../lib/db.js';
import {
    createRazorpayOrder,
    fetchRazorpayOrder,
    verifyCheckoutSignature,
    verifyWebhookSignature,
} from '../lib/razorpay.js';
import { createOrderSchema, verifyPaymentSchema } from '../lib/validators.js';

const router = express.Router();

// ───────── Per-endpoint rate limits ─────────
const createOrderLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 20, // 20 order creations per minute per IP
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: { code: 'RATE_LIMITED', message: 'Too many order requests. Try again in a minute.' } },
});

const verifyLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: { code: 'RATE_LIMITED', message: 'Too many verification requests.' } },
});

const statusLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 60,
    standardHeaders: true,
    legacyHeaders: false,
});

// ───────── Helpers ─────────
function errorBody(code, message, details) {
    return { error: { code, message, ...(details ? { details } : {}) } };
}

// ─────────────────────────────────────────────
// POST /api/payment/create-order
// Body: { planId, durationMonths, customer?, notes? }
// ─────────────────────────────────────────────
router.post('/create-order', createOrderLimiter, async (req, res) => {
    const parsed = createOrderSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json(errorBody('INVALID_INPUT', 'Invalid request body.', parsed.error.flatten()));
    }
    const { planId, durationMonths, customer, notes } = parsed.data;

    let price;
    try {
        price = priceFor(planId, durationMonths);
    } catch (err) {
        if (err instanceof PricingError) {
            return res.status(400).json(errorBody(err.code, err.message));
        }
        throw err;
    }

    // Local idempotency receipt. Razorpay's `receipt` field is a great place
    // for our own correlation ID. Max 40 chars per Razorpay docs.
    const receipt = `fr_${planId.slice(0, 12)}_${Date.now().toString(36)}_${crypto
        .randomBytes(3)
        .toString('hex')}`.slice(0, 40);

    try {
        const rpOrder = await createRazorpayOrder({
            amountPaise: price.total.paise,
            currency: price.currency,
            receipt,
            notes: {
                planId: price.planId,
                planName: price.planName,
                durationMonths: String(price.durationMonths),
                ...(notes || {}),
            },
        });

        orderRepo.create({
            id: rpOrder.id,
            receipt,
            planId: price.planId,
            durationMonths: price.durationMonths,
            amountPaise: price.total.paise,
            currency: price.currency,
            status: 'created',
            customerEmail: customer?.email || null,
            customerName: customer?.name || null,
            notes: notes || null,
        });

        logger.info('Order created', { orderId: rpOrder.id, planId, durationMonths, amount: price.total.rupees });

        // Return only what the frontend needs to launch Razorpay Checkout.
        return res.status(201).json({
            orderId: rpOrder.id,
            receipt,
            amount: rpOrder.amount,          // paise (Razorpay format)
            currency: rpOrder.currency,
            keyId: config.razorpay.keyId,    // public — OK to send
            plan: {
                id: price.planId,
                name: price.planName,
                durationMonths: price.durationMonths,
                monthlyRupees: price.monthly.rupees,
                subtotalRupees: price.subtotal.rupees,
                gstRupees: price.gst.rupees,
                gstPercent: price.gst.percent,
                totalRupees: price.total.rupees,
            },
        });
    } catch (err) {
        logger.error('create-order failed', {
            message: err.message,
            statusCode: err.statusCode,
            error: redact(err.error),
        });
        const status = err.statusCode && err.statusCode >= 400 && err.statusCode < 600 ? err.statusCode : 502;
        return res.status(status).json(
            errorBody(
                'RAZORPAY_ORDER_FAILED',
                err.error?.description || 'Failed to create order with Razorpay.',
                config.env === 'development' ? { upstream: err.error } : undefined
            )
        );
    }
});

// ─────────────────────────────────────────────
// POST /api/payment/verify-payment
// Body: { razorpay_order_id, razorpay_payment_id, razorpay_signature }
// ─────────────────────────────────────────────
router.post('/verify-payment', verifyLimiter, async (req, res) => {
    const parsed = verifyPaymentSchema.safeParse(req.body);
    if (!parsed.success) {
        return res
            .status(400)
            .json(errorBody('INVALID_INPUT', 'Missing or malformed payment fields.', parsed.error.flatten()));
    }
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = parsed.data;

    const order = orderRepo.findById(razorpay_order_id);
    if (!order) {
        logger.warn('verify-payment: unknown order', { razorpay_order_id });
        return res.status(404).json(errorBody('UNKNOWN_ORDER', 'No matching order in our records.'));
    }

    const ok = verifyCheckoutSignature({ razorpay_order_id, razorpay_payment_id, razorpay_signature });
    if (!ok) {
        paymentRepo.record({
            id: razorpay_payment_id,
            orderId: razorpay_order_id,
            signature: null,
            status: 'failed',
            method: null,
            amountPaise: order.amountPaise,
            currency: order.currency,
            errorCode: 'SIGNATURE_MISMATCH',
            errorDescription: 'Signature did not validate against our key secret.',
            raw: null,
        });
        orderRepo.setStatus(razorpay_order_id, 'failed');
        logger.warn('Signature mismatch on verify-payment', { razorpay_order_id, razorpay_payment_id });
        return res.status(400).json(errorBody('SIGNATURE_MISMATCH', 'Payment signature did not verify.'));
    }

    paymentRepo.record({
        id: razorpay_payment_id,
        orderId: razorpay_order_id,
        signature: razorpay_signature,
        status: 'captured',
        method: null,
        amountPaise: order.amountPaise,
        currency: order.currency,
        raw: { razorpay_order_id, razorpay_payment_id },
    });
    orderRepo.setStatus(razorpay_order_id, 'paid');

    logger.info('Payment verified', { razorpay_order_id, razorpay_payment_id, planId: order.planId });

    return res.json({
        verified: true,
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        status: 'paid',
        plan: {
            id: order.planId,
            durationMonths: order.durationMonths,
            amountRupees: order.amountPaise / 100,
            currency: order.currency,
        },
    });
});

// ─────────────────────────────────────────────
// GET /api/payment/status/:orderId
// Returns: { orderId, status, amount, payments[] }
// ─────────────────────────────────────────────
router.get('/status/:orderId', statusLimiter, async (req, res) => {
    const orderId = String(req.params.orderId || '');
    if (!/^order_[A-Za-z0-9]{6,}$/.test(orderId)) {
        return res.status(400).json(errorBody('INVALID_ORDER_ID', 'orderId is not a Razorpay order id.'));
    }

    const local = orderRepo.findById(orderId);
    if (!local) {
        return res.status(404).json(errorBody('UNKNOWN_ORDER', 'Order not found.'));
    }

    // Optionally cross-check live status with Razorpay (rate-limited).
    // If Razorpay is down we still return our cached state.
    let upstream = null;
    try {
        upstream = await fetchRazorpayOrder(orderId);
    } catch (err) {
        logger.warn('fetchRazorpayOrder failed', { orderId, message: err.message });
    }

    const payments = paymentRepo.listForOrder(orderId);

    return res.json({
        orderId: local.id,
        receipt: local.receipt,
        status: local.status,
        amountRupees: local.amountPaise / 100,
        currency: local.currency,
        plan: {
            id: local.planId,
            durationMonths: local.durationMonths,
        },
        upstream: upstream
            ? { status: upstream.status, amount_paid: upstream.amount_paid, attempts: upstream.attempts }
            : null,
        payments: payments.map((p) => ({
            id: p.id,
            status: p.status,
            method: p.method,
            amountRupees: p.amountPaise / 100,
            createdAt: p.createdAt,
        })),
    });
});

// ─────────────────────────────────────────────
// POST /api/payment/webhook   (optional — production hardening)
// Razorpay → server push for paid/failed events. Configure in Razorpay
// Dashboard → Settings → Webhooks with the same secret as RAZORPAY_WEBHOOK_SECRET.
// ─────────────────────────────────────────────
router.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
    const signature = req.headers['x-razorpay-signature'];
    const rawBody = req.body instanceof Buffer ? req.body.toString('utf8') : '';
    if (!verifyWebhookSignature(rawBody, signature)) {
        logger.warn('Webhook signature failed');
        return res.status(400).json(errorBody('WEBHOOK_SIGNATURE_INVALID', 'Webhook signature could not be verified.'));
    }
    let payload;
    try {
        payload = JSON.parse(rawBody);
    } catch {
        return res.status(400).json(errorBody('WEBHOOK_BAD_JSON', 'Webhook body was not valid JSON.'));
    }

    const event = payload.event;
    const orderId = payload?.payload?.payment?.entity?.order_id;
    logger.info('Webhook received', { event, orderId });

    if (orderId) {
        if (event === 'payment.captured') orderRepo.setStatus(orderId, 'paid');
        else if (event === 'payment.failed') orderRepo.setStatus(orderId, 'failed');
        else if (event === 'refund.processed') orderRepo.setStatus(orderId, 'refunded');

        const p = payload?.payload?.payment?.entity;
        if (p) {
            paymentRepo.record({
                id: p.id,
                orderId,
                signature: null,
                status: p.status,
                method: p.method,
                amountPaise: p.amount,
                currency: p.currency,
                errorCode: p.error_code || null,
                errorDescription: p.error_description || null,
                raw: p,
            });
        }
    }

    return res.json({ received: true });
});

export default router;
