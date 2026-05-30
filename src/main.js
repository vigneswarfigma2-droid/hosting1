/**
 * Fraylon Hosting — main bundle
 *
 * Responsibilities:
 *   - Pricing engine + data-driven plan rendering
 *   - Persistent countdown timer (12h offer)
 *   - FAQ accordion (button + ARIA, single-open, keyboard)
 *   - Show/Hide features + nested accordions
 *   - Sticky header scrolled state + active section highlighting
 *   - Smooth scroll for in-page anchors
 *   - Mobile drawer (hamburger anim, submenu toggles, route-then-close)
 *   - Modals (account/login, migration, contact + chat)
 *   - Forms (client-side validation + stub submit + toast)
 *   - Integration hooks on window.fraylonHooks for back-end wiring
 */

(() => {
    'use strict';

    const $ = (sel, root = document) => root.querySelector(sel);
    const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
    const fmtINR = (n) => '₹' + Math.round(n).toLocaleString('en-IN');

    // ─────────────────────────────────────────────
    // 1. Plan data + pricing engine
    // ─────────────────────────────────────────────

    /**
     * Each plan has a base monthly price per supported duration.
     * `listPrice` is the crossed-out retail price shown next to the discount badge.
     * Discount % is computed as (1 - chosenMonthly / listPrice) so the UI stays in sync.
     */
    const PLAN_DATA = [
        {
            id: 'starter',
            name: 'Starter',
            blurb: 'Great for first-time users.',
            popular: false,
            ctaStyle: 'outline',
            ctaLabel: 'Choose Plan',
            listPrice: 399,
            bonusMonths: 0,
            durations: { 12: 129, 24: 109, 36: 89, 48: 69 },
            coreFeatures: [
                { label: '1 website', on: true },
                { label: 'Free AI website builder', on: true },
                { label: 'Free AI credits', on: true },
                { label: '10 GB NVMe storage', on: true },
                { label: 'Free domain for 1 year', on: false },
                { label: '1 email account', on: true, tag: 'FREE' },
                { label: 'WordPress ready', on: true },
                { label: 'Free SSL for your website', on: true },
                { label: 'Node.js web apps', on: false },
            ],
            extraFeatures: [
                'Free email marketer tool',
                { label: 'AI WP speed boost', tag: 'NEW' },
                'LiteSpeed Server + CDN',
                'Free website migration',
                'India server location',
                'Daily backups',
                'Instant malware cleanup',
                '24/7 priority expert support',
            ],
            sections: [
                {
                    title: 'Managed WordPress',
                    items: [
                        { label: '1-Click WP install', on: true },
                        { label: 'WP-CLI + SSH', on: true },
                        { label: 'Auto-updates + security scanner', on: true },
                        { label: 'Object caching', on: false },
                        { label: 'WordPress multisite', on: false },
                        { label: 'WooCommerce ready', on: true },
                    ],
                },
                {
                    title: 'Developer Tools',
                    items: [
                        { label: 'Node.js, Python, Django', on: false },
                        { label: 'Laravel, CodeIgniter, PHP', on: true },
                        { label: 'SSH + GIT access', on: true },
                    ],
                },
                {
                    title: 'Technical Specs',
                    items: [
                        '3,00,000 files & directories (inodes)',
                        '20 PHP workers',
                        '~10,000 visits monthly',
                        '2 subdomains',
                        '25 MySQL max user connections',
                        '2 databases',
                        '1 FTP account & 5 cronjobs',
                        'Multiple PHP versions',
                        'mPanel control panel',
                        '756 MB RAM, 1 CPU core',
                        '6 MBPS IO limit',
                    ],
                },
                {
                    title: 'AI tools included',
                    items: [
                        { label: 'AI image & content generator', on: true },
                        { label: 'AI blog generator', on: false },
                    ],
                },
                {
                    title: 'Security Suite',
                    items: [
                        { label: 'Web application firewall', on: true },
                        { label: 'Enhanced DDoS protection', on: false },
                        { label: 'Secure access manager', on: true },
                        { label: 'Anycast nameservers', on: false },
                    ],
                },
                {
                    title: 'Support & Policies',
                    items: [
                        '24/7 priority expert support',
                        '30-day money-back guarantee',
                        '99.9% uptime guarantee',
                    ],
                },
            ],
        },
        {
            id: 'premium',
            name: 'Premium',
            blurb: 'Best for blogs & startup websites.',
            popular: true,
            ctaStyle: 'primary',
            ctaLabel: 'Choose Plan',
            listPrice: 499,
            bonusMonths: 3,
            durations: { 12: 159, 24: 139, 36: 119, 48: 99 },
            coreFeatures: [
                { label: '25 websites', on: true },
                { label: 'Free AI website builder', on: true },
                { label: 'Free AI credits', on: true },
                { label: '50 GB NVMe storage', on: true },
                { label: 'Free domain for 1 year', on: true },
                { label: '50 email accounts', on: true, tag: 'FREE' },
                { label: 'WordPress ready', on: true },
                { label: 'Free SSL for every website', on: true },
                { label: 'Node.js web apps', on: false },
            ],
            extraFeatures: [
                'Free email marketer tool',
                { label: 'AI WP speed boost', tag: 'NEW' },
                'LiteSpeed Server + CDN',
                'Free website migration',
                'India server location',
                'Daily backups',
                'Instant malware cleanup',
                '24/7 priority expert support',
            ],
            sections: [
                {
                    title: 'Managed WordPress',
                    items: [
                        { label: '1-Click WP install', on: true },
                        { label: 'WP-CLI + SSH', on: true },
                        { label: 'Auto-updates + security scanner', on: true },
                        { label: 'Object caching', on: true },
                        { label: 'WordPress multisite', on: true },
                        { label: 'WooCommerce ready', on: true },
                    ],
                },
                {
                    title: 'Developer Tools',
                    items: [
                        { label: 'Node.js, Python, Django', on: false },
                        { label: 'Laravel, CodeIgniter, PHP', on: true },
                        { label: 'SSH + GIT access', on: true },
                    ],
                },
                {
                    title: 'Technical Specs',
                    items: [
                        '5,00,000 files & directories (inodes)',
                        '40 PHP workers',
                        '~30,000 visits monthly',
                        '100 subdomains',
                        '50 MySQL max user connections',
                        '350 databases',
                        'Unlimited FTP accounts & cronjobs',
                        'Multiple PHP versions',
                        'mPanel control panel',
                        '2 GB RAM, 2 CPU cores',
                        '12 MBPS IO limit',
                    ],
                },
                {
                    title: 'AI tools included',
                    items: [
                        { label: 'AI image & content generator', on: true },
                        { label: 'AI blog generator', on: true },
                    ],
                },
                {
                    title: 'Security Suite',
                    items: [
                        { label: 'Web application firewall', on: true },
                        { label: 'Enhanced DDoS protection', on: true },
                        { label: 'Secure access manager', on: true },
                        { label: 'Anycast nameservers', on: false },
                    ],
                },
                {
                    title: 'Support & Policies',
                    items: [
                        '24/7 priority expert support',
                        '30-day money-back guarantee',
                        '99.9% uptime guarantee',
                    ],
                },
            ],
        },
        {
            id: 'max',
            name: 'Max',
            blurb: 'Built for growing online projects.',
            popular: false,
            ctaStyle: 'outline',
            ctaLabel: 'Choose Plan',
            listPrice: 599,
            bonusMonths: 3,
            durations: { 12: 269, 24: 239, 36: 209, 48: 189 },
            coreFeatures: [
                { label: '50 websites', on: true },
                { label: 'Free AI website builder', on: true },
                { label: 'Free AI credits', on: true },
                { label: '100 GB NVMe storage', on: true },
                { label: 'Free domain for 1 year', on: true },
                { label: '150 email accounts', on: true, tag: 'FREE' },
                { label: 'WordPress ready', on: true },
                { label: 'Free SSL for every website', on: true },
                { label: '20 Node.js web apps', on: true, tag: 'NEW' },
            ],
            extraFeatures: [
                'Free email marketer tool',
                'Built-in WP staging',
                'LiteSpeed Server + CDN',
                'Free website migration',
                'India server location',
                'Daily backups',
                'Instant malware cleanup',
                '24/7 priority expert support',
            ],
            sections: [
                {
                    title: 'Managed WordPress',
                    items: [
                        { label: '1-Click WP install', on: true },
                        { label: 'WP-CLI + SSH', on: true },
                        { label: 'Auto-updates + security scanner', on: true },
                        { label: 'Object caching', on: true },
                        { label: 'WordPress multisite', on: true },
                        { label: 'WooCommerce ready', on: true },
                    ],
                },
                {
                    title: 'Developer Tools',
                    items: [
                        { label: 'Node.js, Python, Django', on: true },
                        { label: 'Laravel, CodeIgniter, PHP', on: true },
                        { label: 'SSH + GIT access', on: true },
                    ],
                },
                {
                    title: 'Technical Specs',
                    items: [
                        '7,00,000 files & directories (inodes)',
                        '100 PHP workers',
                        '~1,25,000 visits monthly',
                        '200 subdomains',
                        '75 MySQL max user connections',
                        '350 databases',
                        'Unlimited FTP accounts & cronjobs',
                        'Multiple PHP versions',
                        'cPanel + 1-click installer',
                        '3 GB RAM, 3 CPU cores',
                        '20 MBPS IO limit',
                    ],
                },
                {
                    title: 'AI tools included',
                    items: [
                        { label: 'AI image & content generator', on: true },
                        { label: 'AI blog generator', on: true },
                    ],
                },
                {
                    title: 'Security Suite',
                    items: [
                        { label: 'Web application firewall', on: true },
                        { label: 'Enhanced DDoS protection', on: true },
                        { label: 'Secure access manager', on: true },
                        { label: 'Anycast nameservers', on: false },
                    ],
                },
                {
                    title: 'Support & Policies',
                    items: [
                        '24/7 priority expert support',
                        '30-day money-back guarantee',
                        '99.9% uptime guarantee',
                    ],
                },
            ],
        },
        {
            id: 'cloud-pro',
            name: 'Cloud Pro',
            blurb: '20x more power with cloud hosting.',
            popular: false,
            ctaStyle: 'outline',
            ctaLabel: 'Choose Plan',
            listPrice: 1499,
            bonusMonths: 3,
            durations: { 12: 599, 24: 549, 36: 499, 48: 449 },
            coreFeatures: [
                { label: '100 websites', on: true },
                { label: 'Free AI website builder', on: true },
                { label: 'Free AI credits', on: true },
                { label: '150 GB NVMe storage', on: true },
                { label: 'Free domain for 1 year', on: true },
                { label: '150 email accounts', on: true, tag: 'FREE' },
                { label: 'WordPress ready', on: true },
                { label: 'Free SSL for every website', on: true },
                { label: '40 Node.js web apps', on: true, tag: 'NEW' },
            ],
            extraFeatures: [
                'Free email marketer tool',
                'Built-in WP staging',
                'LiteSpeed Server + CDN',
                'Free website migration',
                'India server location',
                'Daily backups',
                'Instant malware cleanup',
                '24/7 priority expert support',
            ],
            sections: [
                {
                    title: 'Managed WordPress',
                    items: [
                        { label: '1-Click WP install', on: true },
                        { label: 'WP-CLI + SSH', on: true },
                        { label: 'Auto-updates + security scanner', on: true },
                        { label: 'Object caching', on: true },
                        { label: 'WordPress multisite', on: true },
                        { label: 'WooCommerce ready', on: true },
                    ],
                },
                {
                    title: 'Developer Tools',
                    items: [
                        { label: 'Node.js, Python, Django', on: true },
                        { label: 'Laravel, CodeIgniter, PHP', on: true },
                        { label: 'SSH + GIT access', on: true },
                    ],
                },
                {
                    title: 'Technical Specs',
                    items: [
                        '30,00,000 files & directories (inodes)',
                        '300 PHP workers',
                        '~5,00,000 visits monthly',
                        '500 subdomains',
                        '150 MySQL max user connections',
                        'Unlimited databases',
                        'Unlimited FTP accounts & cronjobs',
                        'Multiple PHP versions',
                        'cPanel + 1-click installer',
                        '6 GB RAM, 6 CPU cores',
                        '50 MBPS IO limit',
                    ],
                },
                {
                    title: 'AI tools included',
                    items: [
                        { label: 'AI image & content generator', on: true },
                        { label: 'AI blog generator', on: true },
                    ],
                },
                {
                    title: 'Security Suite',
                    items: [
                        { label: 'Web application firewall', on: true },
                        { label: 'Enhanced DDoS protection', on: true },
                        { label: 'Secure access manager', on: true },
                        { label: 'Anycast nameservers', on: true },
                    ],
                },
                {
                    title: 'Support & Policies',
                    items: [
                        '24/7 priority expert support',
                        '30-day money-back guarantee',
                        '99.9% uptime guarantee',
                    ],
                },
            ],
        },
    ];

    const SUPPORTED_DURATIONS = [12, 24, 36, 48];

    let currentDuration = 48;

    function priceFor(plan, months) {
        const m = plan.durations[months] || plan.durations[48];
        const list = plan.listPrice;
        const total = m * months;
        const discountPct = Math.max(0, Math.round((1 - m / list) * 100));
        return { monthly: m, list, total, discountPct };
    }

    function cheapestPlanAt(months) {
        return PLAN_DATA.reduce((cheapest, plan) => {
            const p = priceFor(plan, months);
            if (!cheapest || p.monthly < cheapest.price.monthly) return { plan, price: p };
            return cheapest;
        }, null);
    }

    // ─────────────────────────────────────────────
    // 2. Plan card rendering
    // ─────────────────────────────────────────────

    function liFeature(feature) {
        const off = typeof feature === 'object' && feature.on === false;
        const label = typeof feature === 'string' ? feature : feature.label;
        const tag = typeof feature === 'object' && feature.tag
            ? ` <span class="${feature.tag === 'NEW' ? 'badge-new' : ''}">${feature.tag}</span>`
            : '';
        return `<li${off ? ' class="disabled"' : ''}>${label}${tag}</li>`;
    }

    function renderAccordionSection(section, idx, planId) {
        const headerId = `acc-h-${planId}-${idx}`;
        const panelId = `acc-p-${planId}-${idx}`;
        return `
            <div class="accordion-item">
                <button type="button" class="accordion-header" id="${headerId}" aria-expanded="false" aria-controls="${panelId}">
                    <span>${section.title}</span>
                    <i class="fas fa-plus" aria-hidden="true"></i>
                </button>
                <ul class="sub-features" id="${panelId}" role="region" aria-labelledby="${headerId}">
                    ${section.items.map(liFeature).join('')}
                </ul>
            </div>`;
    }

    function renderPlanCard(plan) {
        const p = priceFor(plan, currentDuration);
        const isPopular = plan.popular;
        const ctaClass = plan.ctaStyle === 'primary' ? 'btn-mw-primary' : 'btn-outline-blue';
        const extrasId = `extras-${plan.id}`;
        const seeAllId = `seeall-${plan.id}`;

        return `
        <article class="mw-pricing-card${isPopular ? ' popular' : ''}" data-plan-id="${plan.id}">
            ${isPopular ? '<div class="popular-badge">MOST POPULAR</div>' : ''}
            <div class="card-header">
                <h3>${plan.name}</h3>
                <p>${plan.blurb}</p>
                <div class="discount-row">
                    <span class="badge-orange" data-discount>${p.discountPct}% OFF</span>
                    <span class="old-price" data-old-price>₹${p.list}</span>
                </div>
                <div class="price">₹<span class="price-value" data-price-monthly>${p.monthly}</span><span class="price-mo">/mo</span></div>
                <p class="pay-today" data-pay-today>For ${currentDuration} months, you pay ${fmtINR(p.total)} today — same price at renewal.</p>
                <p class="card-gst-note"><i class="fas fa-info-circle" aria-hidden="true"></i> + 18% GST at checkout</p>
                ${plan.bonusMonths ? `
                <div class="deal-row">
                    <span class="plus-mo">+${plan.bonusMonths} mo free<span class="tooltip">Pay for ${currentDuration} months — use for ${currentDuration + plan.bonusMonths} months.</span></span>
                    ${isPopular ? '<span class="limited-deal">Limited-Time Deal</span>' : ''}
                </div>` : ''}
            </div>
            <button type="button" class="btn ${ctaClass}" data-plan-cta data-plan-id="${plan.id}" data-fraylon-action="select-plan">${plan.ctaLabel}</button>
            <div class="renewal-guarantee">Same Price at Renewal — Guaranteed</div>
            <ul class="card-features">
                ${plan.coreFeatures.map(f => {
                    const off = f.on === false;
                    const tag = f.tag ? ` <span${f.tag === 'NEW' ? ' class="badge-new"' : ''}>${f.tag}</span>` : '';
                    return `<li${off ? ' class="disabled"' : ''}>${f.label}${tag}</li>`;
                }).join('')}
            </ul>
            <div class="mw-extra-features" id="${extrasId}" aria-hidden="true">
                <ul class="card-features">
                    ${plan.extraFeatures.map(liFeature).join('')}
                </ul>
                <div class="card-accordions">
                    ${plan.sections.map((s, i) => renderAccordionSection(s, i, plan.id)).join('')}
                </div>
            </div>
            <button type="button" class="see-all" id="${seeAllId}" aria-expanded="false" aria-controls="${extrasId}">
                <span class="see-all-label">Show features</span>
                <i class="fas fa-chevron-down" aria-hidden="true"></i>
            </button>
        </article>`;
    }

    function renderPlans() {
        const grid = $('#plansGrid');
        if (!grid) return;
        grid.setAttribute('aria-busy', 'true');
        grid.innerHTML = PLAN_DATA.map(renderPlanCard).join('');
        grid.setAttribute('aria-busy', 'false');
        wirePlanInteractions();
        updateHeroAndStickyPrice();
        applyRevealToNewNodes();
    }

    function updatePlanPrices() {
        $$('.mw-pricing-card').forEach(card => {
            const id = card.dataset.planId;
            const plan = PLAN_DATA.find(p => p.id === id);
            if (!plan) return;
            const p = priceFor(plan, currentDuration);
            const priceEl = card.querySelector('[data-price-monthly]');
            const oldEl = card.querySelector('[data-old-price]');
            const discountEl = card.querySelector('[data-discount]');
            const payEl = card.querySelector('[data-pay-today]');
            const tooltipEl = card.querySelector('.plus-mo .tooltip');
            if (priceEl) priceEl.textContent = p.monthly;
            if (oldEl) oldEl.textContent = '₹' + p.list;
            if (discountEl) discountEl.textContent = p.discountPct + '% OFF';
            if (payEl) payEl.textContent = `For ${currentDuration} months, you pay ${fmtINR(p.total)} today — same price at renewal.`;
            if (tooltipEl && plan.bonusMonths) tooltipEl.textContent = `Pay for ${currentDuration} months — use for ${currentDuration + plan.bonusMonths} months.`;
        });
        updateHeroAndStickyPrice();
    }

    function updateHeroAndStickyPrice() {
        const cheapest = cheapestPlanAt(currentDuration);
        if (!cheapest) return;
        const { plan, price } = cheapest;
        const heroV = $('#heroPriceValue');
        const heroDur = $('#heroDurationLabel');
        const heroTotal = $('#heroTotalLabel');
        if (heroV) heroV.textContent = price.monthly;
        if (heroDur) heroDur.textContent = `${currentDuration} mo`;
        if (heroTotal) heroTotal.textContent = fmtINR(price.total);
        // Expose for any consumer
        window.fraylonCheapest = { planId: plan.id, ...price, durationMonths: currentDuration };
    }

    // ─────────────────────────────────────────────
    // 3. Per-card interactions (show/hide, accordion, CTA)
    // ─────────────────────────────────────────────

    function wirePlanInteractions() {
        $$('.see-all').forEach(btn => {
            const target = $('#' + btn.getAttribute('aria-controls'));
            if (!target) return;
            // Initialize collapsed
            target.style.maxHeight = '0px';
            target.style.overflow = 'hidden';

            btn.addEventListener('click', () => {
                const expanded = btn.getAttribute('aria-expanded') === 'true';
                // Toggle this one
                setExtrasOpen(btn, target, !expanded);
            });
        });

        $$('.accordion-header').forEach(header => {
            const panel = $('#' + header.getAttribute('aria-controls'));
            const icon = header.querySelector('i');
            if (!panel) return;
            panel.style.maxHeight = '0px';
            panel.style.overflow = 'hidden';

            const toggle = () => {
                const expanded = header.getAttribute('aria-expanded') === 'true';
                header.setAttribute('aria-expanded', String(!expanded));
                if (!expanded) {
                    panel.style.maxHeight = panel.scrollHeight + 'px';
                    if (icon) icon.className = 'fas fa-minus';
                } else {
                    panel.style.maxHeight = '0px';
                    if (icon) icon.className = 'fas fa-plus';
                }
                bubbleResizeUp(panel);
            };
            header.addEventListener('click', toggle);
            header.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
            });
        });

        $$('[data-plan-cta]').forEach(btn => {
            btn.addEventListener('click', () => {
                // Natural navigation to the cart page — never launch Razorpay
                // directly from the plan CTA. cart.html collects details and
                // starts checkout itself via cart.js → payment.js.
                const id = btn.dataset.planId;
                window.location.href = `cart.html?plan=${encodeURIComponent(id)}&duration=${currentDuration}`;
            });
        });
    }

    function setExtrasOpen(btn, target, open) {
        btn.setAttribute('aria-expanded', String(open));
        target.setAttribute('aria-hidden', String(!open));
        const labelEl = btn.querySelector('.see-all-label');
        const icon = btn.querySelector('i');
        if (open) {
            target.style.maxHeight = target.scrollHeight + 'px';
            if (labelEl) labelEl.textContent = 'Hide features';
            if (icon) icon.className = 'fas fa-chevron-up';
        } else {
            target.style.maxHeight = '0px';
            if (labelEl) labelEl.textContent = 'Show features';
            if (icon) icon.className = 'fas fa-chevron-down';
        }
    }

    function bubbleResizeUp(panel) {
        // When a nested accordion changes size, recompute the enclosing extras region height
        const extras = panel.closest('.mw-extra-features');
        if (extras && extras.getAttribute('aria-hidden') === 'false') {
            // Wait one frame so children settle, then recompute
            requestAnimationFrame(() => {
                extras.style.maxHeight = extras.scrollHeight + 'px';
            });
        }
    }

    // ─────────────────────────────────────────────
    // 4. Countdown timer (persistent across reloads)
    // ─────────────────────────────────────────────

    function initCountdown() {
        const el = $('#timer');
        const bar = $('#topOfferBar');
        if (!el) return;

        const STORAGE_KEY = 'fraylon_offer_ends_at';
        const DURATION_MS = 12 * 60 * 60 * 1000 + 44 * 60 * 1000 + 45 * 1000; // 12h 44m 45s default
        const stored = parseInt(localStorage.getItem(STORAGE_KEY) || '0', 10);
        let endsAt = stored;
        if (!endsAt || endsAt < Date.now()) {
            endsAt = Date.now() + DURATION_MS;
            localStorage.setItem(STORAGE_KEY, String(endsAt));
        }

        function tick() {
            const remaining = endsAt - Date.now();
            if (remaining <= 0) {
                el.textContent = 'Offer ended';
                bar?.classList.add('offer-ended');
                clearInterval(handle);
                // Hide the bar after a moment so it doesn't shout
                setTimeout(() => { if (bar) bar.style.display = 'none'; }, 4000);
                return;
            }
            const h = Math.floor(remaining / 3600000);
            const m = Math.floor((remaining % 3600000) / 60000);
            const s = Math.floor((remaining % 60000) / 1000);
            el.textContent = `${h}H ${String(m).padStart(2, '0')}M ${String(s).padStart(2, '0')}S`;
        }
        tick();
        const handle = setInterval(tick, 1000);
    }

    // ─────────────────────────────────────────────
    // 5. FAQ (data + ARIA buttons)
    // ─────────────────────────────────────────────

    const FAQ_DATA = [
        { q: 'Is Fraylon Hosting an Indian company?', a: 'Yes, Fraylon Hosting is an Indian web hosting company incorporated in December 2025, headquartered in Hyderabad, Telangana. We provide affordable and reliable hosting solutions to businesses across India and worldwide.' },
        { q: 'What features do I get with web hosting?', a: 'With Fraylon Hosting web hosting, you get NVMe SSD storage, free SSL certificate, free domain, LiteSpeed web servers, cPanel control panel, one-click WordPress installation, daily backups, and 24/7 expert support.' },
        { q: 'How is Fraylon Hosting technical support?', a: 'Fraylon Hosting provides 24/7 technical support via live chat and email. Our expert support team is always ready to help you resolve any issues quickly and efficiently.' },
        { q: 'Can I migrate my website to Fraylon Hosting?', a: 'Yes — Fraylon Hosting offers free website migration. Our experts will migrate your website from your existing host to Fraylon without downtime and at no extra cost.' },
        { q: 'Why choose Fraylon Hosting?', a: 'Fraylon combines performance, price, and support: 99.9% uptime guarantee, LiteSpeed servers, free SSL, free migration and 24/7 expert humans — without renewal surprises.' },
        { q: 'Can I upgrade my web hosting plan later?', a: 'Absolutely. You can upgrade your hosting plan at any time as your website grows — from shared hosting to VPS or dedicated servers with zero downtime.' },
    ];

    function renderFaq() {
        const list = $('#faqList');
        if (!list) return;
        list.innerHTML = FAQ_DATA.map((item, idx) => {
            const qid = `faq-q-${idx}`;
            const aid = `faq-a-${idx}`;
            return `
            <div class="faq-item">
                <button type="button" class="faq-question" id="${qid}" aria-expanded="false" aria-controls="${aid}">
                    <span>${item.q}</span>
                    <i class="fas fa-chevron-down faq-icon" aria-hidden="true"></i>
                </button>
                <div class="faq-answer" id="${aid}" role="region" aria-labelledby="${qid}">
                    <p>${item.a}</p>
                </div>
            </div>`;
        }).join('');
        wireFaq();
    }

    function wireFaq() {
        const buttons = $$('#faqList .faq-question');
        buttons.forEach((btn, i) => {
            const panel = $('#' + btn.getAttribute('aria-controls'));
            btn.addEventListener('click', () => toggleFaq(btn));
            btn.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleFaq(btn); return; }
                if (e.key === 'ArrowDown') { e.preventDefault(); buttons[(i + 1) % buttons.length].focus(); }
                if (e.key === 'ArrowUp') { e.preventDefault(); buttons[(i - 1 + buttons.length) % buttons.length].focus(); }
                if (e.key === 'Home') { e.preventDefault(); buttons[0].focus(); }
                if (e.key === 'End') { e.preventDefault(); buttons[buttons.length - 1].focus(); }
            });
        });
    }

    function toggleFaq(btn) {
        const open = btn.getAttribute('aria-expanded') === 'true';
        // Collapse all
        $$('#faqList .faq-question').forEach(b => {
            b.setAttribute('aria-expanded', 'false');
            b.parentElement.classList.remove('open');
        });
        if (!open) {
            btn.setAttribute('aria-expanded', 'true');
            btn.parentElement.classList.add('open');
        }
    }
    // Back-compat: web-hosting.html still calls window.toggleFaq(buttonOrEl)
    window.toggleFaq = function (el) {
        const btn = el?.classList?.contains('faq-question') ? el : el?.querySelector?.('.faq-question');
        if (btn) toggleFaq(btn);
    };

    // ─────────────────────────────────────────────
    // 6. Duration dropdown
    // ─────────────────────────────────────────────

    function initDurationDropdown() {
        const root = $('#durationDropdown');
        if (!root) return;
        const selected = root.querySelector('.dropdown-selected');
        const optionsContainer = root.querySelector('.dropdown-options');
        const options = $$('.option', optionsContainer);
        const label = root.querySelector('.selected-text');

        const open = () => { root.classList.add('active'); root.setAttribute('aria-expanded', 'true'); };
        const close = () => { root.classList.remove('active'); root.setAttribute('aria-expanded', 'false'); };

        selected.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = root.classList.contains('active');
            isOpen ? close() : open();
        });
        root.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); root.classList.contains('active') ? close() : open(); }
            if (e.key === 'Escape') { close(); selected.focus(); }
        });
        options.forEach(opt => {
            opt.addEventListener('click', (e) => {
                e.stopPropagation();
                selectDuration(parseInt(opt.dataset.value, 10), opt);
            });
            opt.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectDuration(parseInt(opt.dataset.value, 10), opt); }
            });
        });
        document.addEventListener('click', (e) => {
            if (!root.contains(e.target)) close();
        });

        function selectDuration(months, optEl) {
            if (!SUPPORTED_DURATIONS.includes(months)) return;
            currentDuration = months;
            options.forEach(o => { o.classList.remove('selected'); o.setAttribute('aria-selected', 'false'); });
            optEl.classList.add('selected');
            optEl.setAttribute('aria-selected', 'true');
            label.textContent = `${months} months`;
            close();
            updatePlanPrices();
            window.fraylonHooks.onDurationChange(months);
        }
    }

    // ─────────────────────────────────────────────
    // 7. Sticky header + active section + smooth scroll
    // ─────────────────────────────────────────────

    function initStickyHeader() {
        const header = $('#siteHeader');
        if (!header) return;
        const onScroll = () => {
            header.classList.toggle('scrolled', window.scrollY > 8);
        };
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
    }

    function initSmoothScroll() {
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a[data-scroll], a[href^="#"]');
            if (!link) return;
            const href = link.getAttribute('href');
            if (!href || !href.startsWith('#') || href === '#') return;
            const target = document.querySelector(href);
            if (!target) return;
            e.preventDefault();
            const headerH = ($('#siteHeader')?.offsetHeight || 0) + 8;
            const y = target.getBoundingClientRect().top + window.scrollY - headerH;
            window.scrollTo({ top: y, behavior: 'smooth' });
            // Close mobile nav if open
            closeMobileNav();
        });
    }

    function initActiveSection() {
        const sectionIds = ['plans-section', 'faq', 'contact'];
        const sections = sectionIds.map(id => $('#' + id)).filter(Boolean);
        if (!sections.length) return;
        const navLinks = $$('a[data-nav-section]');
        const setActive = (id) => {
            navLinks.forEach(l => {
                l.classList.toggle('is-active', l.dataset.navSection === id);
            });
        };
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) setActive(entry.target.id);
            });
        }, { rootMargin: '-40% 0px -50% 0px', threshold: 0 });
        sections.forEach(s => observer.observe(s));
    }

    // ─────────────────────────────────────────────
    // 8. Mobile nav (hamburger + submenu + close-on-route)
    // ─────────────────────────────────────────────

    function initMobileNav() {
        const btn = $('#hamburgerBtn');
        const drawer = $('#mobileNav');
        const overlay = $('#mobileOverlay');
        const closeBtn = $('#mobileClose');
        if (!btn || !drawer || !overlay) return;

        const open = () => {
            drawer.classList.add('open');
            overlay.classList.add('open');
            btn.classList.add('is-open');
            btn.setAttribute('aria-expanded', 'true');
            drawer.setAttribute('aria-hidden', 'false');
            overlay.setAttribute('aria-hidden', 'false');
            document.body.style.overflow = 'hidden';
            // Focus first interactive
            setTimeout(() => closeBtn?.focus(), 80);
        };
        const close = () => {
            drawer.classList.remove('open');
            overlay.classList.remove('open');
            btn.classList.remove('is-open');
            btn.setAttribute('aria-expanded', 'false');
            drawer.setAttribute('aria-hidden', 'true');
            overlay.setAttribute('aria-hidden', 'true');
            document.body.style.overflow = '';
            // Shift focus back to the hamburger button so it doesn't get trapped in a hidden drawer
            setTimeout(() => btn.focus(), 50);
        };
        window.__fraylonCloseMobileNav = close;

        btn.addEventListener('click', open);
        closeBtn?.addEventListener('click', close);
        overlay.addEventListener('click', close);
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && drawer.classList.contains('open')) close();
        });

        // Submenu toggles
        $$('.mw-mobile-sub-toggle', drawer).forEach(t => {
            t.addEventListener('click', () => {
                const expanded = t.getAttribute('aria-expanded') === 'true';
                t.setAttribute('aria-expanded', String(!expanded));
                t.parentElement.classList.toggle('open', !expanded);
            });
        });
    }
    function closeMobileNav() { if (typeof window.__fraylonCloseMobileNav === 'function') window.__fraylonCloseMobileNav(); }

    // ─────────────────────────────────────────────
    // 9. Modals (account, migration, contact)
    // ─────────────────────────────────────────────

    let lastFocusedBeforeModal = null;

    function openModal(id) {
        const modal = document.getElementById(id);
        if (!modal) return;
        closeMobileNav();
        lastFocusedBeforeModal = document.activeElement;
        modal.classList.add('open');
        modal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
        const focusable = modal.querySelector('input, select, textarea, button:not([data-close-modal])');
        setTimeout(() => focusable?.focus(), 60);
        modal.addEventListener('keydown', trapFocus);
    }
    function closeModal(modal) {
        modal.classList.remove('open');
        modal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
        modal.removeEventListener('keydown', trapFocus);
        lastFocusedBeforeModal?.focus?.();
    }
    function trapFocus(e) {
        if (e.key !== 'Tab' && e.key !== 'Escape') return;
        const modal = e.currentTarget;
        if (e.key === 'Escape') { e.preventDefault(); closeModal(modal); return; }
        const focusables = Array.from(modal.querySelectorAll('a, button, input, select, textarea')).filter(el => !el.hasAttribute('disabled') && el.offsetParent !== null);
        if (!focusables.length) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }

    function initModals() {
        document.addEventListener('click', (e) => {
            const opener = e.target.closest('[data-open-modal]');
            if (opener) {
                e.preventDefault();
                openModal(opener.dataset.openModal);
                return;
            }
            const closer = e.target.closest('[data-close-modal]');
            if (closer) {
                const modal = closer.closest('.mw-modal-root');
                if (modal) closeModal(modal);
            }
        });
    }

    // ─────────────────────────────────────────────
    // 10. Forms + toast
    // ─────────────────────────────────────────────

    function showToast(msg, kind = 'info') {
        const toast = $('#toast');
        if (!toast) { console.log('[fraylon toast]', kind, msg); return; }
        toast.textContent = msg;
        toast.className = 'mw-toast show ' + kind;
        clearTimeout(toast._t);
        toast._t = setTimeout(() => toast.classList.remove('show'), 3600);
    }

    function isEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }

    function attachFormHandler(form, onSubmit, statusEl) {
        if (!form) return;
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const data = Object.fromEntries(new FormData(form).entries());
            const result = onSubmit(data);
            if (result.error) {
                if (statusEl) { statusEl.textContent = result.error; statusEl.className = 'form-status error'; }
                showToast(result.error, 'error');
                return;
            }
            if (statusEl) { statusEl.textContent = result.success || 'Done.'; statusEl.className = 'form-status success'; }
            showToast(result.success || 'Done.', 'success');
            form.reset();
            const modal = form.closest('.mw-modal-root');
            if (modal) setTimeout(() => closeModal(modal), 1100);
        });
    }

    function initForms() {
        attachFormHandler($('#accountForm'), (data) => {
            if (!isEmail(data.email)) return { error: 'Please enter a valid email address.' };
            if (!data.password || data.password.length < 4) return { error: 'Please enter your password.' };
            const ok = window.fraylonHooks.onLogin(data);
            return { success: ok || 'Welcome back! Routing you to your dashboard…' };
        }, $('#accountFormStatus'));

        attachFormHandler($('#migrationForm'), (data) => {
            if (!data.name) return { error: 'Please tell us your name.' };
            if (!isEmail(data.email)) return { error: 'Please enter a valid email.' };
            if (!data.domain) return { error: 'Please add the domain you want to migrate.' };
            const ok = window.fraylonHooks.onStartMigration(data);
            return { success: ok || 'Migration request received — we\'ll email you within an hour.' };
        }, $('#migrationFormStatus'));

        attachFormHandler($('#contactForm'), (data) => {
            if (!data.name) return { error: 'Please tell us your name.' };
            if (!isEmail(data.email)) return { error: 'Please enter a valid email.' };
            if (!data.message || data.message.trim().length < 8) return { error: 'A few more details would help us help you.' };
            const ok = window.fraylonHooks.onSubmitContact(data);
            return { success: ok || 'Message sent. We\'ll reply within one business hour.' };
        }, $('#contactFormStatus'));

        attachFormHandler($('#quickContactForm'), (data) => {
            if (!isEmail(data.email)) return { error: 'Please enter a valid email.' };
            if (!data.message || data.message.trim().length < 4) return { error: 'What can we help with?' };
            const ok = window.fraylonHooks.onSubmitContact({ ...data, source: 'chat-modal' });
            return { success: ok || 'Sent — a human will reply shortly.' };
        }, $('#quickContactStatus'));
    }

    // ─────────────────────────────────────────────
    // 11. Mobile carousel for stack cards (Everything you need...)
    // ─────────────────────────────────────────────

    function initMobileStackCardsCarousel() {
        const container = $('.cards-stack-container');
        const section = $('.mw-parallax-cards-section');
        if (!container || !section) return;

        const controls = section.querySelector('.mw-stack-controls');
        const dotsHost = section.querySelector('.mw-stack-dots');
        const prevBtn = section.querySelector('[data-stack-nav="prev"]');
        const nextBtn = section.querySelector('[data-stack-nav="next"]');
        const cards = $$('.stack-card', container);
        if (!controls || !dotsHost || cards.length < 2) return;

        const mq = window.matchMedia('(max-width: 768px)');
        let dots = [];

        const cardStep = () => {
            const first = cards[0]?.getBoundingClientRect();
            const second = cards[1]?.getBoundingClientRect();
            if (!first) return 320;
            if (second) return Math.max(280, Math.round(second.left - first.left));
            return Math.max(280, Math.round(first.width) + 16);
        };

        const setActive = (idx) => {
            dots.forEach((d, i) => d.classList.toggle('is-active', i === idx));
        };

        const activeIndexFromScroll = () => {
            const left = container.scrollLeft;
            const step = cardStep();
            return Math.max(0, Math.min(cards.length - 1, Math.round(left / step)));
        };

        const rebuildDots = () => {
            dotsHost.innerHTML = '';
            dots = cards.map((_, i) => {
                const d = document.createElement('span');
                d.className = 'dot' + (i === 0 ? ' is-active' : '');
                dotsHost.appendChild(d);
                return d;
            });
        };

        const scrollToIndex = (idx) => {
            const step = cardStep();
            container.scrollTo({ left: idx * step, behavior: 'smooth' });
        };

        const onScroll = () => setActive(activeIndexFromScroll());

        const enable = () => {
            controls.style.display = '';
            rebuildDots();
            container.addEventListener('scroll', onScroll, { passive: true });
            prevBtn?.addEventListener('click', () => scrollToIndex(Math.max(0, activeIndexFromScroll() - 1)));
            nextBtn?.addEventListener('click', () => scrollToIndex(Math.min(cards.length - 1, activeIndexFromScroll() + 1)));
            onScroll();
        };

        const disable = () => {
            controls.style.display = 'none';
            dotsHost.innerHTML = '';
            container.removeEventListener('scroll', onScroll);
        };

        const sync = () => {
            if (mq.matches) enable();
            else disable();
        };

        sync();
        mq.addEventListener?.('change', sync);
    }

    // ─────────────────────────────────────────────
    // 12. Scroll-reveal (preserved from previous version)
    // ─────────────────────────────────────────────

    let revealObserver;
    function initReveal() {
        revealObserver = new IntersectionObserver((entries) => {
            entries.forEach(e => {
                if (e.isIntersecting) {
                    e.target.classList.add('mw-visible');
                    revealObserver.unobserve(e.target);
                }
            });
        }, { threshold: 0.1 });
        applyRevealToNewNodes();
    }
    function applyRevealToNewNodes() {
        if (!revealObserver) return;
        const targets = $$(
            '.mw-pricing-card, .guarantee-card, .testimonial-card, .why-feature-item, .why-grid-item, .faq-item, .support-card, .feature-card, .parallax-card, .mw-hero-text, .mw-hero-visual'
        );
        const delays = ['', 'mw-reveal-d1', 'mw-reveal-d2', 'mw-reveal-d3'];
        targets.forEach((el, i) => {
            if (el.classList.contains('mw-reveal')) return;
            el.classList.add('mw-reveal');
            const d = delays[i % 4];
            if (d) el.classList.add(d);
            revealObserver.observe(el);
        });
    }

    // ─────────────────────────────────────────────
    // 13. Testimonial slider (preserved)
    // ─────────────────────────────────────────────

    function initTestimonialSlider() {
        const track = $('.testimonial-track');
        if (!track) return;
        const cards = $$('.testimonial-card', track);
        if (!cards.length) return;
        const prev = $('.slider-nav .nav-btn:first-child');
        const next = $('.slider-nav .nav-btn:last-child');
        let i = 0;
        const update = () => { track.style.transform = `translateX(${i * -100}%)`; };
        next?.addEventListener('click', () => { i = (i + 1) % cards.length; update(); });
        prev?.addEventListener('click', () => { i = (i - 1 + cards.length) % cards.length; update(); });
    }

    // ─────────────────────────────────────────────
    // 14. Audience carousel (used by web-hosting.html — preserved)
    // ─────────────────────────────────────────────

    window.scrollAudience = function (direction) {
        const grid = document.getElementById('audienceGrid');
        if (!grid) return;
        const card = grid.querySelector('.audience-card');
        const step = card ? card.getBoundingClientRect().width + 24 : 320;
        grid.scrollBy({ left: direction * step, behavior: 'smooth' });
    };

    // ─────────────────────────────────────────────
    // 15. Integration hooks
    // ─────────────────────────────────────────────

    /**
     * Back-end-ready hooks. Override any of these from product or analytics code:
     *   window.fraylonHooks.onPlanSelect = (planId, months) => { ... }
     * Return a string from a hook to display a custom success message in the UI.
     */
    window.fraylonHooks = window.fraylonHooks || {
        onPlanSelect(planId, months) {
            console.log('[fraylon] onPlanSelect', planId, months);
            // Route through the cart page — checkout is started from cart.html
            // (cart.js → payment.js), never directly from a plan CTA.
            window.location.href = `cart.html?plan=${encodeURIComponent(planId)}&duration=${months}`;
        },
        onDurationChange(months) {
            console.log('[fraylon] onDurationChange', months);
        },
        onLogin(data) {
            console.log('[fraylon] onLogin (stub)', { email: data.email });
            return 'Welcome back! Routing you to your dashboard…';
        },
        onStartMigration(data) {
            console.log('[fraylon] onStartMigration (stub)', data);
            return null;
        },
        onSubmitContact(data) {
            console.log('[fraylon] onSubmitContact (stub)', data);
            return null;
        },
    };

    function initNavbarActiveHighlights() {
        let path = window.location.pathname;
        let page = path.substring(path.lastIndexOf('/') + 1);
        if (!page || page === '') {
            page = 'index.html';
        }

        // Loop through all anchor elements inside the desktop navigation
        $$('.mw-nav-ul a').forEach(link => {
            const href = link.getAttribute('href');
            if (!href) return;
            
            const linkPage = href.split('#')[0].split('?')[0];
            if (linkPage === page) {
                if (link.classList.contains('mega-item')) {
                    link.classList.add('active');
                } else {
                    link.classList.add('is-active');
                }
                
                const parentLi = link.closest('.has-submenu');
                if (parentLi) {
                    parentLi.classList.add('active');
                    const triggerLink = parentLi.querySelector('a');
                    if (triggerLink) triggerLink.classList.add('is-active');
                }
            }
        });
        
        // Loop through mobile nav links too
        $$('.mw-mobile-nav-ul a').forEach(link => {
            const href = link.getAttribute('href');
            if (!href) return;
            const linkPage = href.split('#')[0].split('?')[0];
            if (linkPage === page) {
                link.classList.add('is-active');
                const parentLi = link.closest('.has-sub');
                if (parentLi) {
                    parentLi.classList.add('active');
                    const subToggle = parentLi.querySelector('.mw-mobile-sub-toggle');
                    if (subToggle) subToggle.classList.add('is-active');
                }
            }
        });
    }

    // ─────────────────────────────────────────────
    // Boot
    // ─────────────────────────────────────────────

    document.addEventListener('DOMContentLoaded', () => {
        initNavbarActiveHighlights();
        initReveal();
        renderPlans();
        renderFaq();
        initDurationDropdown();
        initCountdown();
        initStickyHeader();
        initSmoothScroll();
        initActiveSection();
        initMobileNav();
        initModals();
        initForms();
        initMobileStackCardsCarousel();
        initTestimonialSlider();
    });
})();
