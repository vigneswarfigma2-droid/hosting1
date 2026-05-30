/**
 * Frontend payment integration — talks to /api/payment and launches
 * Razorpay Checkout in the browser.
 *
 * Usage:
 *   import { startCheckout } from './payment.js';
 *   startCheckout({ planId: 'premium', durationMonths: 48, customer: {...} });
 *
 * Or via global hook (already wired in main.js):
 *   window.fraylonHooks.onPlanSelect = (planId, months) =>
 *       startCheckout({ planId, durationMonths: months });
 */

const RZP_SCRIPT_URL = 'https://checkout.razorpay.com/v1/checkout.js';

// Use same-origin (empty base) for any local/dev context so we never create
// real Razorpay orders against prod while testing from 127.0.0.1, a LAN IP,
// or a phone on the same network. Anything else hits the Railway backend.
const _host = window.location.hostname;
const _isLocal =
  _host === '' || // file:// or unknown
  /^(localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\]|.*\.local)$/i.test(_host) ||
  /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(_host); // private LAN
const API_BASE = _isLocal
  ? ''
  : 'https://fraylonhosting-production.up.railway.app';

let _rzpReady = null;
function ensureRazorpayLoaded() {
    if (_rzpReady) return _rzpReady;
    _rzpReady = new Promise((resolve, reject) => {
        if (window.Razorpay) return resolve(window.Razorpay);
        const s = document.createElement('script');
        s.src = RZP_SCRIPT_URL;
        s.async = true;
        s.onload = () => resolve(window.Razorpay);
        s.onerror = () => reject(new Error('Failed to load Razorpay Checkout SDK.'));
        document.head.appendChild(s);
    });
    return _rzpReady;
}

async function apiPost(path, body) {
    const res = await fetch(`${API_BASE}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        const err = new Error(data?.error?.message || `Request failed (${res.status})`);
        err.code = data?.error?.code;
        err.status = res.status;
        err.details = data?.error?.details;
        throw err;
    }
    return data;
}

async function apiGet(path) {
    const res = await fetch(`${API_BASE}${path}`);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        const err = new Error(data?.error?.message || `Request failed (${res.status})`);
        err.code = data?.error?.code;
        throw err;
    }
    return data;
}

/**
 * Run the full checkout flow.
 *
 * @param {object} opts
 * @param {string} opts.planId            'starter' | 'premium' | 'max' | 'cloud-pro'
 * @param {number} opts.durationMonths    12 | 24 | 36 | 48
 * @param {object} [opts.customer]        { name, email, phone }
 * @param {object} [opts.notes]           arbitrary key/value strings stored on the order
 * @param {(orderId:string)=>void} [opts.onSuccess]
 * @param {(err:Error)=>void}     [opts.onFailure]
 * @param {()=>void}              [opts.onDismiss]
 */
export async function startCheckout(opts) {
    const { planId, durationMonths, customer = {}, notes, onSuccess, onFailure, onDismiss } = opts;

    if (!planId || !durationMonths) {
        const err = new Error('startCheckout: planId and durationMonths are required');
        onFailure?.(err);
        throw err;
    }

    // 1. Get Razorpay SDK + create an order in parallel.
    let order, Rzp;
    try {
        [Rzp, order] = await Promise.all([
            ensureRazorpayLoaded(),
            apiPost('/api/payment/create-order', { planId, durationMonths, customer, notes }),
        ]);
    } catch (err) {
        console.error('[fraylon] create-order failed', err);
        onFailure?.(err);
        throw err;
    }

    // 2. Launch Razorpay Checkout modal.
    return new Promise((resolve) => {
        const rzp = new Rzp({
            key: order.keyId,
            amount: order.amount,           // already in paise
            currency: order.currency,
            order_id: order.orderId,
            name: 'Fraylon Hosting',
            description: `${order.plan.name} · ${order.plan.durationMonths} months`,
            image: '/logo.png',
            prefill: {
                name: customer.name || '',
                email: customer.email || '',
                contact: customer.phone || '',
            },
            theme: { color: '#146EF5' },
            modal: {
                ondismiss: () => {
                    onDismiss?.();
                    resolve({ status: 'dismissed', orderId: order.orderId });
                },
            },
            handler: async (response) => {
                // 3. Verify the payment signature with our server.
                try {
                    const verified = await apiPost('/api/payment/verify-payment', {
                        razorpay_order_id: response.razorpay_order_id,
                        razorpay_payment_id: response.razorpay_payment_id,
                        razorpay_signature: response.razorpay_signature,
                    });
                    onSuccess?.(verified);
                    resolve({ status: 'paid', ...verified });
                } catch (err) {
                    console.error('[fraylon] verify-payment failed', err);
                    onFailure?.(err);
                    resolve({ status: 'verification_failed', error: err });
                }
            },
        });

        rzp.on('payment.failed', (resp) => {
            const err = new Error(resp?.error?.description || 'Payment failed.');
            err.code = resp?.error?.code;
            console.error('[fraylon] payment.failed', resp);
            onFailure?.(err);
            resolve({ status: 'failed', error: err });
        });

        rzp.open();
    });
}

/**
 * Look up an order's current status (useful for /thank-you pages).
 */
export function getOrderStatus(orderId) {
    return apiGet(`/api/payment/status/${encodeURIComponent(orderId)}`);
}
