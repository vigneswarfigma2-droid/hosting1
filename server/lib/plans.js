/**
 * SERVER-AUTHORITATIVE PRICE CATALOG.
 *
 * Critical security rule: NEVER trust the amount the client sends.
 * The browser sends only `{ planId, durationMonths }`. The server
 * computes the amount from this catalog. If the client tampers with
 * the price in DevTools, the server-computed amount wins.
 *
 * Mirror this with `src/main.js` PLAN_DATA when you change prices.
 */

import { config } from '../config.js';

export const PLANS = {
    starter: {
        id: 'starter',
        name: 'Starter',
        listPrice: 399,
        durations: { 12: 129, 24: 109, 36: 89, 48: 69 },
    },
    premium: {
        id: 'premium',
        name: 'Premium',
        listPrice: 499,
        durations: { 12: 159, 24: 139, 36: 119, 48: 99 },
    },
    max: {
        id: 'max',
        name: 'Max',
        listPrice: 599,
        durations: { 12: 269, 24: 239, 36: 209, 48: 189 },
    },
    'cloud-pro': {
        id: 'cloud-pro',
        name: 'Cloud Pro',
        listPrice: 1499,
        durations: { 12: 599, 24: 549, 36: 499, 48: 449 },
    },
};

export const SUPPORTED_DURATIONS = [12, 24, 36, 48];

/**
 * Compute the order amount (server-side authority).
 * Returns amounts in:
 *   - rupees (display)
 *   - paise (Razorpay API, which always uses the smallest currency unit)
 */
export function priceFor(planId, durationMonths) {
    const plan = PLANS[planId];
    if (!plan) throw new PricingError('UNKNOWN_PLAN', `No plan with id "${planId}".`);
    if (!SUPPORTED_DURATIONS.includes(durationMonths)) {
        throw new PricingError('UNSUPPORTED_DURATION', `Duration must be one of: ${SUPPORTED_DURATIONS.join(', ')}.`);
    }
    const monthlyRupees = plan.durations[durationMonths];
    if (typeof monthlyRupees !== 'number') {
        throw new PricingError('NO_PRICE_FOR_DURATION', `Plan "${planId}" has no price for ${durationMonths} months.`);
    }
    const subtotalRupees = monthlyRupees * durationMonths;
    const gstRupees = Math.round((subtotalRupees * config.gstPercent) / 100);
    const totalRupees = subtotalRupees + gstRupees;
    return {
        planId,
        planName: plan.name,
        durationMonths,
        currency: config.defaultCurrency,
        monthly: { rupees: monthlyRupees, paise: monthlyRupees * 100 },
        subtotal: { rupees: subtotalRupees, paise: subtotalRupees * 100 },
        gst: { rupees: gstRupees, paise: gstRupees * 100, percent: config.gstPercent },
        total: { rupees: totalRupees, paise: totalRupees * 100 },
        listPrice: plan.listPrice,
    };
}

export class PricingError extends Error {
    constructor(code, message) {
        super(message);
        this.name = 'PricingError';
        this.code = code;
    }
}
