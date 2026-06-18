/**
 * Razorpay SDK wrapper + signature verification helpers.
 *
 * SDK docs: https://razorpay.com/docs/api/orders/
 */

import Razorpay from 'razorpay';
import crypto from 'node:crypto';
import { config } from '../config.js';

let _client = null;

export function getRazorpayClient() {
    if (_client) return _client;
    _client = new Razorpay({
        key_id: config.razorpay.keyId,
        key_secret: config.razorpay.keySecret,
    });
    return _client;
}

/**
 * Create a Razorpay order.
 * `amountPaise` MUST come from server-side pricing (see lib/plans.js).
 */
export async function createRazorpayOrder({ amountPaise, currency, receipt, notes }) {
    const client = getRazorpayClient();
    return client.orders.create({
        amount: amountPaise,
        currency,
        receipt,
        payment_capture: 1,    // auto-capture
        notes: notes || {},
    });
}

/**
 * Fetch a Razorpay order (live status from Razorpay, not our DB).
 */
export async function fetchRazorpayOrder(orderId) {
    return getRazorpayClient().orders.fetch(orderId);
}

/**
 * Verify the checkout signature returned by Razorpay's modal after a successful payment.
 * Signature = HMAC_SHA256(razorpay_order_id + "|" + razorpay_payment_id, KEY_SECRET).
 * Returns true if the signature is authentic.
 */
export function verifyCheckoutSignature({ razorpay_order_id, razorpay_payment_id, razorpay_signature }) {
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) return false;
    const expected = crypto
        .createHmac('sha256', config.razorpay.keySecret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');
    // timing-safe compare
    const a = Buffer.from(expected, 'utf8');
    const b = Buffer.from(razorpay_signature, 'utf8');
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
}

/**
 * Verify a Razorpay webhook signature (header: x-razorpay-signature).
 * Used by optional /api/payment/webhook endpoint.
 */
export function verifyWebhookSignature(rawBody, signatureHeader) {
    if (!config.razorpay.webhookSecret) return false;
    const expected = crypto
        .createHmac('sha256', config.razorpay.webhookSecret)
        .update(rawBody)
        .digest('hex');
    const a = Buffer.from(expected, 'utf8');
    const b = Buffer.from(signatureHeader || '', 'utf8');
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
}
