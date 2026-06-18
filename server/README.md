# Fraylon Payments Backend

Node.js + Express service that creates Razorpay orders, verifies payment signatures, and tracks order status in a local SQLite database. Designed to plug into the existing static Fraylon site without changing the frontend stack.

---

## Architecture

```
Frontend (browser, Vite)               This server (Express, port 4242)
─────────────────────────              ──────────────────────────────────
User clicks "Choose plan"      ──►     POST /api/payment/create-order
                                       ├─ validate input (zod)
                                       ├─ compute amount from PLANS catalog ◄── server-authoritative
                                       ├─ call razorpay.orders.create()
                                       └─ INSERT into orders (status=created)
                                ◄──    { orderId, keyId, amount, plan }

Razorpay Checkout modal opens (frontend) → user pays → modal callback

                               ──►     POST /api/payment/verify-payment
                                       ├─ HMAC_SHA256(order_id|payment_id, KEY_SECRET)
                                       ├─ timing-safe compare with razorpay_signature
                                       ├─ INSERT into payments
                                       └─ UPDATE orders SET status='paid'
                                ◄──    { verified: true, orderId, status: 'paid' }

Thank-you / details page       ──►     GET /api/payment/status/:orderId
                                       └─ read local DB + cross-check with Razorpay
                                ◄──    { status, payments[], upstream }

(Optional production hardening)
Razorpay                       ──►     POST /api/payment/webhook
                                       └─ verify x-razorpay-signature, update order/payment
                                ◄──    { received: true }
```

The server **never trusts the client-sent amount**. It looks up `planId` and `durationMonths` in `server/lib/plans.js` and computes the total itself. If the frontend sends `amount: 1` the server still charges the catalog price.

---

## Quickstart

### 1. Install dependencies

```powershell
npm install
```

`better-sqlite3` is a native module — npm will compile it during install. On Windows it needs the C++ build tools (`npm install --global windows-build-tools` if it fails).

### 2. Configure secrets

The repo includes a working `.env` (for local dev only — gitignored). Verify it has:

```env
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...
PORT=4242
```

For production, copy `.env.example` to `.env` and fill in **live** keys from the Razorpay dashboard.

### 3. Run the API

```powershell
npm run server         # plain node
npm run server:dev     # node --watch (auto-restart on edits)
```

You should see:

```
[INFO] SQLite ready at .../server/data/fraylon.db
[INFO] Fraylon API listening on http://localhost:4242  (env=development)
```

### 4. Run the frontend

```powershell
npm run dev            # Vite on :5173
```

The frontend automatically targets `http://localhost:4242` for API calls when served from a Vite dev port (see `apiBase()` in `src/payment.js`). For production, host frontend and API on the same origin or override with a meta tag:

```html
<meta name="fraylon-api-base" content="https://api.fraylon.com">
```

### 5. End-to-end test in the browser

1. Open `http://localhost:5173/pricing.html`
2. Click **Choose Plan** on any card.
3. Razorpay Checkout opens.
4. Use a Razorpay **test card**:
   - **Card:** `4111 1111 1111 1111`
   - **Expiry:** any future date
   - **CVV:** any 3 digits
   - **OTP:** `1234`
   - Test UPI VPA: `success@razorpay`
   - Failed UPI VPA: `failure@razorpay`
   See: https://razorpay.com/docs/payments/payments/test-card-details/
5. You'll be redirected to `details.html?orderId=order_xxx&status=paid`.

---

## Endpoints

### `POST /api/payment/create-order`

**Request**
```json
{
    "planId": "premium",
    "durationMonths": 48,
    "customer": { "email": "you@example.com", "name": "Yuvaraj" },
    "notes": { "source": "homepage" }
}
```

**Response 201**
```json
{
    "orderId": "order_NQxxx",
    "receipt": "fr_premium_lp9q2j_4f8a",
    "amount": 561136,
    "currency": "INR",
    "keyId": "rzp_test_SoLxgiN1n0rTNA",
    "plan": {
        "id": "premium",
        "name": "Premium",
        "durationMonths": 48,
        "monthlyRupees": 99,
        "subtotalRupees": 4752,
        "gstRupees": 855,
        "gstPercent": 18,
        "totalRupees": 5607
    }
}
```

`amount` is in **paise** (Razorpay standard). `totalRupees` is for display.

### `POST /api/payment/verify-payment`

**Request** (the exact shape Razorpay's `handler` gives you)
```json
{
    "razorpay_order_id": "order_NQxxx",
    "razorpay_payment_id": "pay_NQyyy",
    "razorpay_signature": "abc123..."
}
```

**Response 200**
```json
{
    "verified": true,
    "orderId": "order_NQxxx",
    "paymentId": "pay_NQyyy",
    "status": "paid",
    "plan": { "id": "premium", "durationMonths": 48, "amountRupees": 5607.36, "currency": "INR" }
}
```

**Response 400** on tampered/missing signature:
```json
{ "error": { "code": "SIGNATURE_MISMATCH", "message": "Payment signature did not verify." } }
```

### `GET /api/payment/status/:orderId`

```json
{
    "orderId": "order_NQxxx",
    "status": "paid",
    "amountRupees": 5607.36,
    "currency": "INR",
    "plan": { "id": "premium", "durationMonths": 48 },
    "upstream": { "status": "paid", "amount_paid": 561136, "attempts": 1 },
    "payments": [
        { "id": "pay_NQyyy", "status": "captured", "method": null, "amountRupees": 5607.36, "createdAt": "2026-05-12 04:12:33" }
    ]
}
```

### `POST /api/payment/webhook` (optional)

Subscribe in Razorpay Dashboard → Settings → Webhooks. Set:
- URL: `https://api.fraylon.com/api/payment/webhook`
- Secret: any string, also put into `RAZORPAY_WEBHOOK_SECRET` in `.env`
- Events: `payment.captured`, `payment.failed`, `refund.processed`

Useful because the in-page `handler` doesn't fire if the user closes the tab right after paying; webhooks reconcile reliably.

---

## File map

```
server/
├── server.js                 Express bootstrap, middleware, error handler
├── config.js                 .env loader + ready check
├── routes/
│   └── payment.js            create-order · verify-payment · status · webhook
├── lib/
│   ├── plans.js              SERVER-AUTHORITATIVE pricing catalog
│   ├── razorpay.js           SDK wrapper + HMAC verification
│   ├── db.js                 better-sqlite3 + orders/payments tables
│   ├── logger.js             leveled logger + redactor
│   └── validators.js         zod schemas for request bodies
└── data/                     gitignored SQLite database
```

---

## Security checklist

| Concern | How it's addressed |
|---|---|
| Client tampering with amount | Server recomputes amount from `lib/plans.js`. Client `amount` field is ignored. |
| Signature spoofing | `crypto.timingSafeEqual` compare against `HMAC_SHA256(order_id+"|"+payment_id, KEY_SECRET)`. |
| Secret leakage | `KEY_SECRET` lives only in `.env` (gitignored). Only `KEY_ID` is sent to the browser. |
| Replay attacks | Order rows are keyed by Razorpay's unique `order_id`; status transitions to `paid` are idempotent (`INSERT OR REPLACE` on payments + single `UPDATE` on orders). |
| Denial-of-service | `express-rate-limit` per endpoint (20/min create-order, 30/min verify, 60/min status). |
| Common web vulns | `helmet` for security headers, `cors` allowlist, JSON body capped at 32 kb. |
| Logging secrets | `logger.redact()` strips `key_secret`, `signature`, `password`, etc. before logging. |
| HTTPS | Run behind a TLS-terminating proxy (Nginx/Caddy/Cloudflare) in production. `trust proxy` is set so `req.ip` is honest. |

**Test keys you provided were posted in chat in plain text.** Rotate them before going to production:
1. Razorpay Dashboard → Settings → API Keys → Regenerate
2. Update `.env` with the new pair
3. Restart the server

---

## Operations

### Inspect the database

```powershell
# Sqlite CLI (if installed):
sqlite3 server/data/fraylon.db "SELECT id, plan_id, status, amount_paise FROM orders ORDER BY created_at DESC LIMIT 20;"
```

### Switch to Postgres later

Replace `server/lib/db.js`. Call sites (`orderRepo.create`, `orderRepo.findById`, `orderRepo.setStatus`, `paymentRepo.record`, `paymentRepo.listForOrder`) are the entire surface — keep those signatures stable.

### Production deploy

1. Build static frontend: `npm run build` → outputs `dist/`
2. Set `NODE_ENV=production` in `.env`
3. Update `CORS_ORIGINS` to your prod domains
4. `npm start` will serve both the API **and** the static frontend on the same port (see `server.js` static block).
5. Put Nginx / Caddy in front for HTTPS termination + gzip.

---

## Frontend integration

```js
import { startCheckout, getOrderStatus } from './src/payment.js';

// Anywhere a "Buy" button needs to launch checkout:
await startCheckout({
    planId: 'premium',
    durationMonths: 48,
    customer: { name: 'Yuvaraj', email: 'y@example.com' },
    onSuccess: (v) => location.href = `/thank-you?orderId=${v.orderId}`,
    onFailure: (err) => alert(err.message),
});
```

Already wired:
- **Pricing cards** (any page using `main.js`) → `window.fraylonHooks.onPlanSelect` calls `startCheckout`.
- **`cart.html` checkout button** reads `?plan=…&duration=…` from the URL and calls `startCheckout`.

To override the hook from your own code (e.g. to record analytics first):

```js
const original = window.fraylonHooks.onPlanSelect;
window.fraylonHooks.onPlanSelect = async (planId, months) => {
    analytics.track('plan_selected', { planId, months });
    return original(planId, months);
};
```
