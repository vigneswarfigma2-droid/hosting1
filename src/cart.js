/**
 * Cart page controller.
 *
 * Reads `?plan=<id>&duration=<months>` from the URL on load and drives every
 * piece of cart UI (plan name, period dropdown, save badge, order summary,
 * coupon, checkout) from a single state object. Previously the cart had
 * hardcoded "Premium / 48 months" markup everywhere — so a user clicking
 * "Choose Plan" on Starter still saw Premium pricing.
 *
 * This module also handles:
 *   - Period dropdown open/close + selection
 *   - Coupon code application (currently: DEAL10 → 10% off)
 *   - Domain card collapse
 *   - "Continue to Payment" button → opens Razorpay via src/payment.js
 */

import { startCheckout } from './payment.js';

// ─────────────── Plan catalogue (mirror of server/lib/plans.js) ───────────────

const PLANS = {
    starter: {
        id: 'starter',
        name: 'Starter',
        listPrice: 399,
        durations: { 12: 129, 24: 109, 36: 89, 48: 69 },
        freeDomain: false,
        bonusMonths: 0,
    },
    premium: {
        id: 'premium',
        name: 'Premium',
        listPrice: 499,
        durations: { 12: 159, 24: 139, 36: 119, 48: 99 },
        freeDomain: true,
        bonusMonths: 3,
    },
    max: {
        id: 'max',
        name: 'Max',
        listPrice: 599,
        durations: { 12: 269, 24: 239, 36: 209, 48: 189 },
        freeDomain: true,
        bonusMonths: 3,
    },
    'cloud-pro': {
        id: 'cloud-pro',
        name: 'Cloud Pro',
        listPrice: 1499,
        durations: { 12: 599, 24: 549, 36: 499, 48: 449 },
        freeDomain: true,
        bonusMonths: 3,
    },
};

const SUPPORTED_DURATIONS = [12, 24, 36, 48];
const FREE_DOMAIN_VALUE = 1199;
const GST_PERCENT = 18;

// ─────────────── State ───────────────

const state = readInitialState();

function readInitialState() {
    const url = new URLSearchParams(location.search);
    const rawPlan = (url.get('plan') || 'premium').toLowerCase();
    const planId = PLANS[rawPlan] ? rawPlan : 'premium';
    const rawDuration = parseInt(url.get('duration') || '48', 10);
    const durationMonths = SUPPORTED_DURATIONS.includes(rawDuration) ? rawDuration : 48;
    const coupon = null; // applied later via UI
    return { planId, durationMonths, coupon };
}

// ─────────────── Pricing ───────────────

function priceFor(planId, months) {
    const plan = PLANS[planId];
    const monthlyRupees = plan.durations[months];
    const subtotal = monthlyRupees * months;
    const listSubtotal = plan.listPrice * months;
    const bonusValue = plan.bonusMonths * plan.listPrice; // implied retail value of the free months
    const domainValue = plan.freeDomain ? FREE_DOMAIN_VALUE : 0;
    const couponDiscount = state.coupon === 'DEAL10' ? Math.round(subtotal * 0.10 * 100) / 100 : 0;
    const afterCoupon = Math.max(0, subtotal - couponDiscount);
    const gst = Math.round(afterCoupon * (GST_PERCENT / 100) * 100) / 100;
    const total = Math.round((afterCoupon + gst) * 100) / 100;
    // "Total savings" mirrors the original UI: pre-GST savings * 1.18
    const preGstSavings = listSubtotal - subtotal + bonusValue + domainValue + couponDiscount;
    const totalSavings = Math.round(preGstSavings * 1.18 * 100) / 100;
    return {
        plan,
        months,
        monthlyRupees,
        subtotal,
        listSubtotal,
        bonusValue,
        domainValue,
        couponDiscount,
        afterCoupon,
        gst,
        total,
        totalSavings,
    };
}

const inr = (n) => '₹' + Math.round(n).toLocaleString('en-IN');
const inrDecimal = (n) =>
    '₹' +
    n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// ─────────────── Renderers ───────────────

function render() {
    const p = priceFor(state.planId, state.durationMonths);

    // Plan card title
    setText('.cart-card-title', `${p.plan.name} plan`);

    // Period dropdown — selected display + menu options (re-render for new plan prices)
    const trigger = document.querySelector('#cartDurationTrigger span');
    if (trigger) trigger.textContent = `${state.durationMonths} months`;
    renderDurationMenu(p.plan);

    // Save badge + main price block
    const savings = (p.plan.listPrice - p.monthlyRupees) * state.durationMonths;
    setText('.save-badge', `Save ${inr(savings)}`);
    setText('.pricing-stack .old-price', `${inr(p.plan.listPrice)}/mo`);
    setText('.pricing-stack .main-price', `${inr(p.monthlyRupees)}/mo`);

    // Plan-feature line (free domain bullet) — toggle visibility
    const featureLine = document.querySelector('.plan-feature-line');
    if (featureLine) {
        featureLine.style.display = p.plan.freeDomain ? 'flex' : 'none';
        const span = featureLine.querySelector('span');
        if (span) {
            span.textContent = p.plan.bonusMonths
                ? `Includes free domain for 1 year + ${p.plan.bonusMonths} extra months`
                : 'Includes free domain for 1 year';
        }
    }

    // Domain card — hide entirely if the plan doesn't include a free domain
    const domainCard = document.querySelector('#domainCard');
    if (domainCard) domainCard.style.display = p.plan.freeDomain ? '' : 'none';

    // Order summary — main item name
    setText('.summary-item .item-name', `${p.plan.name} plan`);

    // Order summary detail rows
    renderSummaryDetails(p);

    // Totals
    setText('#summarySubtotal', inr(p.afterCoupon));
    setText('#summaryGST', inrDecimal(p.gst));
    setText('#summaryTotal', inrDecimal(p.total));
    setText('.total-savings-text span', inrDecimal(p.totalSavings));

    // Coupon row — visibility
    const discountRow = document.querySelector('#discountRow');
    const couponSection = document.querySelector('.coupon-section');
    if (state.coupon === 'DEAL10') {
        if (discountRow) {
            discountRow.style.display = 'flex';
            const valueEl = discountRow.querySelector('.value.discount');
            if (valueEl) valueEl.textContent = '-' + inrDecimal(p.couponDiscount);
        }
        if (couponSection) couponSection.style.display = 'none';
    } else {
        if (discountRow) discountRow.style.display = 'none';
        if (couponSection) couponSection.style.display = '';
    }

    // Keep URL canonical so refresh + share preserves state
    const newQuery = `?plan=${encodeURIComponent(state.planId)}&duration=${state.durationMonths}`;
    if (location.search !== newQuery) {
        history.replaceState({}, '', location.pathname + newQuery);
    }
}

function renderDurationMenu(plan) {
    const menu = document.querySelector('.cart-dropdown-menu');
    if (!menu) return;
    menu.innerHTML = SUPPORTED_DURATIONS.map((m) => {
        const isSelected = m === state.durationMonths;
        const price = plan.durations[m];
        return `
            <div class="cart-dropdown-option${isSelected ? ' selected' : ''}" data-months="${m}">
                <span class="months">${m} months</span>
                <span class="price">${inr(price)}/mo</span>
            </div>`;
    }).join('');
}

function renderSummaryDetails(p) {
    const container = document.querySelector('.summary-details');
    if (!container) return;
    const discountRow = container.querySelector('#discountRow');
    const rows = [];

    rows.push(`
        <div class="detail-row">
            <span class="label">${state.durationMonths}-month plan</span>
            <span class="value"><span class="old">${inr(p.listSubtotal)}</span> ${inr(p.subtotal)}</span>
        </div>`);

    if (p.plan.bonusMonths) {
        rows.push(`
            <div class="detail-row">
                <span class="label">+ ${p.plan.bonusMonths} extra months</span>
                <span class="value"><span class="old">${inr(p.bonusValue)}</span> ₹0</span>
            </div>`);
    }

    if (p.plan.freeDomain) {
        rows.push(`
            <div class="detail-row">
                <span class="label">+ Free domain for 1 year</span>
                <span class="value"><span class="old">${inr(p.domainValue)}</span> ₹0</span>
            </div>`);
    }

    // Re-attach the existing #discountRow at the end so the coupon UI keeps working
    container.innerHTML = rows.join('');
    if (discountRow) container.appendChild(discountRow);
}

function setText(selector, text) {
    const el = document.querySelector(selector);
    if (el) el.textContent = text;
}

// ─────────────── Event wiring ───────────────

function wireDurationDropdown() {
    const trigger = document.getElementById('cartDurationTrigger');
    const container = document.getElementById('cartDurationContainer');
    if (!trigger || !container) return;

    trigger.addEventListener('click', () => container.classList.toggle('open'));
    document.addEventListener('click', (e) => {
        if (!container.contains(e.target)) container.classList.remove('open');
    });

    // Use event delegation since options are re-rendered on plan change
    const menu = container.querySelector('.cart-dropdown-menu');
    if (!menu) return;
    menu.addEventListener('click', (e) => {
        const opt = e.target.closest('.cart-dropdown-option');
        if (!opt) return;
        const m = parseInt(opt.dataset.months, 10);
        if (!SUPPORTED_DURATIONS.includes(m)) return;
        state.durationMonths = m;
        container.classList.remove('open');
        render();
    });
}

function wireCoupon() {
    const applyBtn = document.querySelector('.coupon-section .btn-apply');
    const input = document.querySelector('.coupon-section input');
    const removeBtn = document.getElementById('removeCoupon');

    applyBtn?.addEventListener('click', () => {
        const code = (input?.value || '').trim().toUpperCase();
        if (!code) return alert('Please enter a coupon code.');
        if (code === 'DEAL10') {
            state.coupon = 'DEAL10';
            render();
        } else {
            alert('Invalid coupon code.');
        }
    });

    // Remove button is re-attached after render, so use delegation on the summary block
    document.addEventListener('click', (e) => {
        if (e.target.closest('#removeCoupon')) {
            state.coupon = null;
            const input = document.querySelector('.coupon-section input');
            if (input) input.value = '';
            render();
        }
    });
}

function wireDomainCard() {
    const skipDomain = document.getElementById('skipDomain');
    const domainCard = document.getElementById('domainCard');
    const domainHeader = document.querySelector('.domain-alert-header');
    skipDomain?.addEventListener('click', () => domainCard?.classList.add('collapsed'));
    domainHeader?.addEventListener('click', () => domainCard?.classList.toggle('collapsed'));
}

function wireCheckoutButton() {
    const btn = document.getElementById('cartPayButton');
    if (!btn) return;
    const label = btn.querySelector('.cart-pay-label');
    const spinner = btn.querySelector('.cart-pay-spinner');
    const status = document.getElementById('cartPayStatus');

    const setBusy = (busy) => {
        btn.disabled = busy;
        if (label) label.textContent = busy ? 'Opening secure payment…' : 'Continue to Payment';
        if (spinner) spinner.hidden = !busy;
    };
    const setStatus = (msg, kind) => {
        if (!status) return;
        status.textContent = msg || '';
        status.className = 'cart-pay-status' + (kind ? ' ' + kind : '');
    };

    btn.addEventListener('click', async () => {
        setBusy(true);
        setStatus('');
        try {
            await startCheckout({
                planId: state.planId,
                durationMonths: state.durationMonths,
                notes: state.coupon ? { coupon: state.coupon } : undefined,
                onSuccess: (v) => {
                    console.log('Payment verified, redirecting to success');
                    setStatus('Payment confirmed. Redirecting…', 'success');
                    setTimeout(() => {
                        location.href = `success.html?orderId=${encodeURIComponent(v.orderId)}`;
                    }, 800);
                },
                onFailure: (err) =>
                    setStatus(
                        err?.code === 'SIGNATURE_MISMATCH'
                            ? 'Payment verification failed. Contact support.'
                            : err?.message || 'Could not initiate payment. Please try again.',
                        'error'
                    ),
                onDismiss: () => setStatus('Payment cancelled.', 'info'),
            });
        } catch (err) {
            setStatus(err.message || 'Could not start payment.', 'error');
        } finally {
            setBusy(false);
        }
    });
}

function wireMobileNav() {
    const btn = document.getElementById('hamburgerBtn');
    const nav = document.getElementById('mobileNav');
    const overlay = document.getElementById('mobileOverlay');
    const cls = document.getElementById('mobileClose');
    if (!btn || !nav || !overlay) return;
    const openNav = () => {
        nav.classList.add('open');
        overlay.classList.add('open');
        document.body.style.overflow = 'hidden';
    };
    const closeNav = () => {
        nav.classList.remove('open');
        overlay.classList.remove('open');
        document.body.style.overflow = '';
    };
    btn.addEventListener('click', openNav);
    cls?.addEventListener('click', closeNav);
    overlay.addEventListener('click', closeNav);
}

// ─────────────── Boot ───────────────

function boot() {
    render();
    wireDurationDropdown();
    wireCoupon();
    wireDomainCard();
    wireCheckoutButton();
    wireMobileNav();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
} else {
    boot();
}
