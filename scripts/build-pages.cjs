/* eslint-disable */
// One-shot generator for shared-shell pages.
// Run: node scripts/build-pages.js
// Produces: hosting.html, wordpress.html, pricing.html, about-us.html, 404.html
// All pages share an identical head/header/footer/mobile-drawer/modals shell.

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

function head({ title, description, canonical = '', extraHead = '' }) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="theme-color" content="#146EF5">
    <title>${title}</title>
    <meta name="description" content="${description}">
    ${canonical ? `<link rel="canonical" href="${canonical}">` : ''}
    <link rel="icon" type="image/svg+xml" href="./public/favicon.svg">

    <meta property="og:type" content="website">
    <meta property="og:site_name" content="Fraylon Hosting">
    <meta property="og:title" content="${title}">
    <meta property="og:description" content="${description}">
    <meta property="og:image" content="./src/assets/dashboard.avif">

    <link rel="stylesheet" href="./src/style.css">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    ${extraHead}
</head>`;
}

function header(activePage) {
    const is = (p) => activePage === p ? ' class="is-active"' : '';
    return `<body>
    <div class="mw-top-bar" id="topOfferBar" role="region" aria-label="Limited-time offer">
        <div class="container">
            <div class="top-bar-content">
                <p>Limited-time savings — ends in <span id="timer" aria-live="polite" aria-atomic="true">--H --M --S</span></p>
                <a href="pricing.html" class="view-plans">View Plans</a>
            </div>
        </div>
    </div>

    <header class="mw-header" id="siteHeader">
        <div class="container mw-nav-container">
            <div class="mw-logo-wrapper">
                <div class="mw-logo">
                    <a href="index.html" aria-label="Fraylon Hosting — home">
                        <img src="logo.png" alt="Fraylon Hosting">
                    </a>
                </div>
            </div>
            <nav class="mw-nav" aria-label="Primary">
                <ul class="mw-nav-ul">
                    <li class="has-submenu">
                        <a href="hosting.html"${is('hosting')}>Hosting <i class="fas fa-chevron-down" aria-hidden="true"></i></a>
                        <div class="mw-mega-menu">
                            <a href="web-hosting.html" class="mega-item">
                                <div class="mega-item-icon-wrap"><i class="fas fa-server" aria-hidden="true"></i></div>
                                <div class="mega-item-body">
                                    <div class="mega-item-header"><span class="mega-item-title">Web Hosting</span><span class="mega-item-badge badge-offer">80% OFF</span></div>
                                    <p class="mega-item-desc">For new and business websites</p>
                                </div>
                            </a>
                            <a href="hosting.html#cloud" class="mega-item">
                                <div class="mega-item-icon-wrap"><i class="fas fa-cloud" aria-hidden="true"></i></div>
                                <div class="mega-item-body">
                                    <div class="mega-item-header"><span class="mega-item-title">Cloud Hosting</span><span class="mega-item-badge badge-premium">PREMIUM</span></div>
                                    <p class="mega-item-desc">For growing and scalable websites</p>
                                </div>
                            </a>
                            <a href="hosting.html#nodejs" class="mega-item">
                                <div class="mega-item-icon-wrap"><i class="fas fa-code" aria-hidden="true"></i></div>
                                <div class="mega-item-body">
                                    <div class="mega-item-header"><span class="mega-item-title">Node.js Hosting</span></div>
                                    <p class="mega-item-desc">Run modern JavaScript apps</p>
                                </div>
                            </a>
                        </div>
                    </li>
                    <li><a href="wordpress.html"${is('wordpress')}>WordPress</a></li>
                    <li><a href="pricing.html"${is('pricing')}>Pricing</a></li>
                    <li><a href="index.html#contact">Support</a></li>
                    <li><a href="about-us.html"${is('about')}>About Us</a></li>
                </ul>
            </nav>
            <div class="mw-header-actions">
                <button type="button" class="btn btn-outline-account" data-open-modal="accountModal" data-fraylon-action="open-account">My Account</button>
                <button class="mw-hamburger" id="hamburgerBtn" aria-label="Open menu" aria-controls="mobileNav" aria-expanded="false">
                    <span></span><span></span><span></span>
                </button>
            </div>
        </div>
    </header>`;
}

function footer() {
    return `    <footer class="mw-footer">
        <div class="container">
            <div class="footer-main">
                <div class="footer-brand">
                    <img src="logo.png" alt="Fraylon Logo" class="footer-logo-white">
                    <p class="brand-desc">Fraylon Hosting is an Indian web hosting company, incorporated December 2025 and headquartered in Hyderabad, Telangana. We help businesses, developers, and startups host their websites reliably across India.</p>
                    <div class="footer-socials">
                        <a href="coming-soon.html" aria-label="Fraylon on Facebook"><i class="fab fa-facebook-f" aria-hidden="true"></i></a>
                        <a href="coming-soon.html" aria-label="Fraylon on X / Twitter"><i class="fab fa-x-twitter" aria-hidden="true"></i></a>
                        <a href="coming-soon.html" aria-label="Fraylon on LinkedIn"><i class="fab fa-linkedin-in" aria-hidden="true"></i></a>
                        <a href="coming-soon.html" aria-label="Fraylon on Instagram"><i class="fab fa-instagram" aria-hidden="true"></i></a>
                        <a href="coming-soon.html" aria-label="Fraylon on YouTube"><i class="fab fa-youtube" aria-hidden="true"></i></a>
                    </div>
                </div>

                <div class="footer-links-grid">
                    <div class="footer-col">
                        <h3>HOSTING</h3>
                        <ul>
                            <li><a href="web-hosting.html">Web Hosting</a></li>
                            <li><a href="hosting.html#cloud">Cloud Hosting</a></li>
                            <li><a href="wordpress.html">WordPress Hosting</a></li>
                            <li><a href="wordpress.html#managed">Managed WordPress</a></li>
                            <li><a href="hosting.html#nodejs">Node.js Hosting</a></li>
                            <li><a href="coming-soon.html">SSL Certificates</a></li>
                        </ul>
                    </div>
                    <div class="footer-col">
                        <h3>VPS &amp; SERVERS</h3>
                        <ul>
                            <li><a href="coming-soon.html">VPS Hosting</a></li>
                            <li><a href="coming-soon.html">Managed VPS</a></li>
                            <li><a href="coming-soon.html">Windows VPS</a></li>
                            <li><a href="coming-soon.html">Dedicated Server</a></li>
                        </ul>
                        <h3 class="mt-4">DOMAIN &amp; EMAIL</h3>
                        <ul>
                            <li><a href="coming-soon.html">Domain Registration</a></li>
                            <li><a href="coming-soon.html">Business Email</a></li>
                            <li><a href="coming-soon.html">SSL Certificate</a></li>
                        </ul>
                    </div>
                    <div class="footer-col">
                        <h3>TOOLS</h3>
                        <ul>
                            <li><a href="coming-soon.html">AI Website Builder</a></li>
                        </ul>
                    </div>
                    <div class="footer-col">
                        <h3>COMPANY</h3>
                        <ul>
                            <li><a href="about-us.html">About Fraylon</a></li>
                            <li><a href="coming-soon.html">Customer Reviews</a></li>
                            <li><a href="coming-soon.html">Blog</a></li>
                            <li><a href="coming-soon.html">Knowledge Base</a></li>
                            <li><a href="coming-soon.html">Video Tutorials</a></li>
                            <li><a href="index.html#contact">Contact Us</a></li>
                            <li><a href="coming-soon.html">Sitemap</a></li>
                        </ul>
                        <h3 class="mt-4">LEGAL</h3>
                        <ul>
                            <li><a href="coming-soon.html">Privacy Policy</a></li>
                            <li><a href="coming-soon.html">Terms of Service</a></li>
                            <li><a href="coming-soon.html">SLA</a></li>
                        </ul>
                    </div>
                </div>
            </div>

            <div class="footer-bottom">
                <div class="copyright-row"><p>© Copyright 2025 - 2026 Fraylon Hosting. All rights reserved.</p></div>
                <div class="payment-row">
                    <div class="payment-icons">
                        <img loading="lazy" src="./src/assets/visa_icon.svg" alt="Visa">
                        <img loading="lazy" src="./src/assets/mastercard_icon.svg" alt="Mastercard">
                        <img loading="lazy" src="./src/assets/rupay_icon.svg" alt="RuPay">
                        <img loading="lazy" src="./src/assets/upi_icon.svg" alt="UPI">
                        <img loading="lazy" src="./src/assets/gpay_icon.svg" alt="Google Pay">
                        <img loading="lazy" src="./src/assets/phone-pe.svg" alt="PhonePe">
                    </div>
                    <a href="coming-soon.html" class="more-payments">And more payment options</a>
                </div>
            </div>
        </div>
    </footer>`;
}

function shellTail() {
    return `
    <button class="mw-chat-bubble" type="button" aria-label="Open support chat" data-open-modal="contactModal" data-fraylon-action="open-chat-bubble">
        <i class="fas fa-comment-dots" aria-hidden="true"></i>
    </button>

    <div class="mw-mobile-overlay" id="mobileOverlay" aria-hidden="true"></div>
    <nav class="mw-mobile-nav" id="mobileNav" aria-label="Mobile navigation" aria-hidden="true">
        <div class="mw-mobile-nav-header">
            <img src="logo.png" alt="Fraylon Hosting" class="mw-mobile-logo">
            <button class="mw-mobile-close" id="mobileClose" type="button" aria-label="Close menu"><i class="fas fa-times" aria-hidden="true"></i></button>
        </div>
        <ul class="mw-mobile-nav-ul">
            <li><a href="index.html">Home</a></li>
            <li class="has-sub">
                <button type="button" class="mw-mobile-sub-toggle" aria-expanded="false">Hosting <i class="fas fa-chevron-down" aria-hidden="true"></i></button>
                <ul class="mw-mobile-sub">
                    <li><a href="hosting.html">Overview</a></li>
                    <li><a href="web-hosting.html">Web Hosting</a></li>
                    <li><a href="hosting.html#cloud">Cloud Hosting</a></li>
                    <li><a href="hosting.html#nodejs">Node.js Hosting</a></li>
                </ul>
            </li>
            <li><a href="wordpress.html">WordPress</a></li>
            <li><a href="pricing.html">Pricing</a></li>
            <li><a href="index.html#contact">Support</a></li>
            <li><a href="about-us.html">About Us</a></li>
        </ul>
        <button type="button" class="btn btn-mw-primary mw-mobile-cta" data-open-modal="accountModal">My Account</button>
    </nav>

    <div class="mw-toast" id="toast" role="status" aria-live="polite" aria-atomic="true"></div>

    <div class="mw-modal-root" id="accountModal" role="dialog" aria-modal="true" aria-labelledby="accountModalTitle" aria-hidden="true">
        <div class="mw-modal-backdrop" data-close-modal></div>
        <div class="mw-modal-panel" role="document">
            <button type="button" class="mw-modal-close" data-close-modal aria-label="Close"><i class="fas fa-times" aria-hidden="true"></i></button>
            <div class="mw-modal-head">
                <span class="mw-modal-kicker">Customer area</span>
                <h2 id="accountModalTitle">Sign in to your dashboard</h2>
                <p>Manage sites, billing, backups, and DNS in one place.</p>
            </div>
            <form class="mw-modal-form" id="accountForm" novalidate>
                <div class="form-field"><label for="amEmail">Email</label><input type="email" id="amEmail" name="email" required autocomplete="email" placeholder="you@company.com"></div>
                <div class="form-field"><label for="amPassword">Password</label><input type="password" id="amPassword" name="password" required autocomplete="current-password" placeholder="••••••••"></div>
                <div class="form-row split"><label class="checkbox-line"><input type="checkbox" name="remember"> Stay signed in</label><a href="coming-soon.html">Forgot password?</a></div>
                <button type="submit" class="btn btn-mw-primary" data-fraylon-action="submit-login">Sign in</button>
                <p class="form-status" id="accountFormStatus" role="status" aria-live="polite"></p>
                <p class="modal-foot">No account yet? <a href="coming-soon.html">Create one in 60 seconds</a></p>
            </form>
        </div>
    </div>

    <div class="mw-modal-root" id="migrationModal" role="dialog" aria-modal="true" aria-labelledby="migrationModalTitle" aria-hidden="true">
        <div class="mw-modal-backdrop" data-close-modal></div>
        <div class="mw-modal-panel" role="document">
            <button type="button" class="mw-modal-close" data-close-modal aria-label="Close"><i class="fas fa-times" aria-hidden="true"></i></button>
            <div class="mw-modal-head"><span class="mw-modal-kicker">Free site migration</span><h2 id="migrationModalTitle">Tell us about your site</h2><p>Our migrations team will reach out within one business hour.</p></div>
            <form class="mw-modal-form" id="migrationForm" novalidate>
                <div class="form-row two">
                    <div class="form-field"><label for="mfName">Your name</label><input type="text" id="mfName" name="name" required autocomplete="name"></div>
                    <div class="form-field"><label for="mfEmail">Email</label><input type="email" id="mfEmail" name="email" required autocomplete="email"></div>
                </div>
                <div class="form-row two">
                    <div class="form-field"><label for="mfDomain">Domain to migrate</label><input type="text" id="mfDomain" name="domain" placeholder="example.com" required></div>
                    <div class="form-field"><label for="mfCurrentHost">Current host</label><input type="text" id="mfCurrentHost" name="currentHost" placeholder="GoDaddy, Hostinger…"></div>
                </div>
                <div class="form-field"><label for="mfStack">Site type</label>
                    <select id="mfStack" name="stack"><option value="wordpress">WordPress</option><option value="static">Static HTML / Jamstack</option><option value="php">Custom PHP</option><option value="node">Node.js</option><option value="other">Other</option></select>
                </div>
                <div class="form-field"><label for="mfNotes">Anything we should know? <span class="muted">(optional)</span></label><textarea id="mfNotes" name="notes" rows="3" placeholder="DB sizes, custom configs, downtime preferences…"></textarea></div>
                <button type="submit" class="btn btn-mw-primary" data-fraylon-action="submit-migration">Request migration</button>
                <p class="form-status" id="migrationFormStatus" role="status" aria-live="polite"></p>
            </form>
        </div>
    </div>

    <div class="mw-modal-root" id="contactModal" role="dialog" aria-modal="true" aria-labelledby="contactModalTitle" aria-hidden="true">
        <div class="mw-modal-backdrop" data-close-modal></div>
        <div class="mw-modal-panel" role="document">
            <button type="button" class="mw-modal-close" data-close-modal aria-label="Close"><i class="fas fa-times" aria-hidden="true"></i></button>
            <div class="mw-modal-head"><span class="mw-modal-kicker">Live chat</span><h2 id="contactModalTitle">Start a conversation</h2><p>Send us a quick message — average response time is under 30 seconds.</p></div>
            <form class="mw-modal-form" id="quickContactForm" novalidate>
                <div class="form-field"><label for="qcEmail">Your email</label><input type="email" id="qcEmail" name="email" required autocomplete="email"></div>
                <div class="form-field"><label for="qcMessage">What can we help with?</label><textarea id="qcMessage" name="message" rows="4" required></textarea></div>
                <button type="submit" class="btn btn-mw-primary" data-fraylon-action="submit-quick-contact">Send message</button>
                <p class="form-status" id="quickContactStatus" role="status" aria-live="polite"></p>
            </form>
        </div>
    </div>

    <script type="module" src="./src/main.js"></script>
</body>
</html>`;
}

function page({ title, description, activePage, bodyHtml }) {
    return `${head({ title, description })}
${header(activePage)}
    <main>
${bodyHtml}
    </main>
${footer()}
${shellTail()}`;
}

// ─────────────── HOSTING PAGE ───────────────
const HOSTING_BODY = `
        <section class="page-hero" aria-labelledby="hostingHero">
            <div class="page-hero-glow" aria-hidden="true"></div>
            <div class="container page-hero-container">
                <span class="page-eyebrow"><span class="eyebrow-pulse" aria-hidden="true"></span> Hosting plans</span>
                <h1 id="hostingHero">Pick the hosting that <span class="text-blue">fits your build</span>.</h1>
                <p class="page-hero-lede">From a personal blog to a Node.js app serving 5 lakh visitors — every plan runs on the same NVMe-powered Indian backbone, with free migration and the same price at renewal.</p>
                <div class="page-hero-actions">
                    <a href="pricing.html" class="btn btn-mw-primary">See all plans <i class="fas fa-arrow-right" aria-hidden="true"></i></a>
                    <button type="button" class="btn btn-mw-secondary" data-open-modal="migrationModal">Migrate my site for free</button>
                </div>
                <ul class="page-hero-trust">
                    <li><i class="fas fa-circle-check" aria-hidden="true"></i> 99.9% uptime SLA</li>
                    <li><i class="fas fa-circle-check" aria-hidden="true"></i> India-based servers</li>
                    <li><i class="fas fa-circle-check" aria-hidden="true"></i> 24/7 human support</li>
                </ul>
            </div>
        </section>

        <section class="hosting-types" id="web" aria-labelledby="webHostingHeading">
            <div class="container">
                <div class="type-card">
                    <div class="type-card-icon type-icon-blue"><i class="fas fa-server" aria-hidden="true"></i></div>
                    <div class="type-card-body">
                        <span class="type-card-badge">Most popular</span>
                        <h2 id="webHostingHeading">Web Hosting</h2>
                        <p>Fast, affordable shared hosting for marketing sites, small e-commerce stores, and personal projects. Get a site live in under 10 minutes.</p>
                        <ul class="type-card-features">
                            <li><i class="fas fa-bolt" aria-hidden="true"></i> NVMe SSD + LiteSpeed + page cache</li>
                            <li><i class="fas fa-globe" aria-hidden="true"></i> Free domain for 1 year</li>
                            <li><i class="fas fa-lock" aria-hidden="true"></i> Free SSL on every site</li>
                            <li><i class="fas fa-envelope" aria-hidden="true"></i> Up to 150 free email accounts</li>
                            <li><i class="fas fa-rotate-left" aria-hidden="true"></i> Daily backups + 1-click restore</li>
                        </ul>
                        <div class="type-card-actions">
                            <a href="web-hosting.html" class="btn btn-mw-primary">Explore Web Hosting</a>
                            <span class="type-card-price">from <strong>₹69/mo</strong></span>
                        </div>
                    </div>
                </div>

                <div class="type-card type-card-alt" id="cloud">
                    <div class="type-card-icon type-icon-cyan"><i class="fas fa-cloud" aria-hidden="true"></i></div>
                    <div class="type-card-body">
                        <span class="type-card-badge badge-premium">Premium</span>
                        <h2>Cloud Hosting</h2>
                        <p>Dedicated CPU and RAM, isolated container, and 20× the headroom of shared. The right pick for high-traffic blogs and growing online stores.</p>
                        <ul class="type-card-features">
                            <li><i class="fas fa-microchip" aria-hidden="true"></i> Up to 6 CPU cores + 6 GB RAM</li>
                            <li><i class="fas fa-network-wired" aria-hidden="true"></i> Anycast nameservers + DDoS shield</li>
                            <li><i class="fas fa-gauge-high" aria-hidden="true"></i> Built-in WP staging + object caching</li>
                            <li><i class="fas fa-database" aria-hidden="true"></i> Unlimited databases</li>
                            <li><i class="fas fa-headset" aria-hidden="true"></i> Priority 24/7 expert support</li>
                        </ul>
                        <div class="type-card-actions">
                            <a href="pricing.html#cloud-pro" class="btn btn-mw-primary">See Cloud plans</a>
                            <span class="type-card-price">from <strong>₹449/mo</strong></span>
                        </div>
                    </div>
                </div>

                <div class="type-card" id="nodejs">
                    <div class="type-card-icon type-icon-green"><i class="fab fa-node-js" aria-hidden="true"></i></div>
                    <div class="type-card-body">
                        <span class="type-card-badge badge-new">New</span>
                        <h2>Node.js Hosting</h2>
                        <p>Run Express, Fastify, Next.js, Nuxt, NestJS — or any Node app — without wrestling with PM2 or reverse proxies. SSH, GIT and zero-downtime deploys come standard.</p>
                        <ul class="type-card-features">
                            <li><i class="fas fa-rocket" aria-hidden="true"></i> Up to 40 concurrent Node apps</li>
                            <li><i class="fas fa-code-branch" aria-hidden="true"></i> Git push to deploy</li>
                            <li><i class="fas fa-shield-halved" aria-hidden="true"></i> Auto-restart + log streaming</li>
                            <li><i class="fas fa-terminal" aria-hidden="true"></i> Full SSH access</li>
                            <li><i class="fas fa-arrows-rotate" aria-hidden="true"></i> Multiple Node versions side-by-side</li>
                        </ul>
                        <div class="type-card-actions">
                            <a href="pricing.html" class="btn btn-mw-primary">See Node.js plans</a>
                            <span class="type-card-price">from <strong>₹189/mo</strong></span>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <section class="hosting-compare-strip">
            <div class="container">
                <h2>Not sure which to pick?</h2>
                <p>Most sites are happy on <strong>Web Hosting</strong>. If you're already getting more than ~30,000 visits a month, plan an e-commerce launch, or run anything custom, move up to <strong>Cloud</strong>. Building with Express, Next.js, or any JS runtime? Go straight to <strong>Node.js</strong>.</p>
                <div class="page-hero-actions">
                    <a href="pricing.html" class="btn btn-mw-primary">Compare all plans</a>
                    <a href="index.html#contact" class="btn btn-mw-secondary">Talk to a human</a>
                </div>
            </div>
        </section>
`;

// ─────────────── WORDPRESS PAGE ───────────────
const WORDPRESS_BODY = `
        <section class="page-hero page-hero-wp" aria-labelledby="wpHero">
            <div class="page-hero-glow" aria-hidden="true"></div>
            <div class="container page-hero-container">
                <span class="page-eyebrow"><span class="eyebrow-pulse" aria-hidden="true"></span> Managed WordPress</span>
                <h1 id="wpHero">WordPress, the way it should run.</h1>
                <p class="page-hero-lede">LiteSpeed-powered. AI-optimised. One-click install. Updates and security baked in — so you spend time on the site, not the stack.</p>
                <div class="page-hero-actions">
                    <a href="pricing.html" class="btn btn-mw-primary">Start a WP site <i class="fas fa-arrow-right" aria-hidden="true"></i></a>
                    <button type="button" class="btn btn-mw-secondary" data-open-modal="migrationModal">Migrate from another host</button>
                </div>
                <ul class="page-hero-trust">
                    <li><i class="fas fa-bolt" aria-hidden="true"></i> Up to 20× faster</li>
                    <li><i class="fas fa-circle-check" aria-hidden="true"></i> One-click WP install</li>
                    <li><i class="fas fa-shield-halved" aria-hidden="true"></i> Daily backups + WAF</li>
                </ul>
            </div>
        </section>

        <section class="wp-features" aria-labelledby="wpFeaturesHeading">
            <div class="container">
                <div class="wp-features-header">
                    <h2 id="wpFeaturesHeading">Everything a serious WordPress site needs</h2>
                    <p>Pre-tuned for the plugins and themes you actually use — and the ones you haven't downloaded yet.</p>
                </div>
                <div class="wp-features-grid">
                    <div class="wp-feature-card">
                        <div class="wp-feature-icon"><i class="fas fa-gauge-high" aria-hidden="true"></i></div>
                        <h3>LiteSpeed + LSCache</h3>
                        <p>Server-level caching, image optimisation, and HTTP/3 out of the box. Most WP sites see TTFB drop below 200ms after switching.</p>
                    </div>
                    <div class="wp-feature-card">
                        <div class="wp-feature-icon"><i class="fas fa-circle-bolt" aria-hidden="true"></i></div>
                        <h3>1-click WP install</h3>
                        <p>Pick a domain, pick a theme, and you're at the dashboard in 90 seconds — SSL provisioned automatically before the first request.</p>
                    </div>
                    <div class="wp-feature-card">
                        <div class="wp-feature-icon"><i class="fas fa-robot" aria-hidden="true"></i></div>
                        <h3>AI speed boost</h3>
                        <p>Our optimizer ships critical CSS, inlines above-the-fold images, and lazy-loads everything below. No plugin to configure.</p>
                    </div>
                    <div class="wp-feature-card">
                        <div class="wp-feature-icon"><i class="fas fa-shield-halved" aria-hidden="true"></i></div>
                        <h3>WAF + malware cleanup</h3>
                        <p>Real-time firewall, brute-force protection, and free malware removal if anything slips through.</p>
                    </div>
                    <div class="wp-feature-card">
                        <div class="wp-feature-icon"><i class="fas fa-flask" aria-hidden="true"></i></div>
                        <h3>Built-in staging</h3>
                        <p>Spin up a copy of your site in one click, test plugin updates, then push live without touching the database.</p>
                    </div>
                    <div class="wp-feature-card">
                        <div class="wp-feature-icon"><i class="fas fa-rotate-left" aria-hidden="true"></i></div>
                        <h3>Daily off-site backups</h3>
                        <p>30 days of restore points, all stored separately from your live site. One click brings everything back.</p>
                    </div>
                </div>
            </div>
        </section>

        <section class="wp-managed-strip" id="managed">
            <div class="container">
                <div class="managed-card">
                    <div class="managed-card-body">
                        <span class="page-eyebrow"><span class="eyebrow-pulse" aria-hidden="true"></span> Managed WordPress</span>
                        <h2>The "no-ops" plan for sites that earn revenue.</h2>
                        <p>We take over plugin updates, performance tuning, security monitoring, and uptime checks — so your team can stop maintaining and start shipping.</p>
                        <ul class="managed-checklist">
                            <li><i class="fas fa-check" aria-hidden="true"></i> Automatic core + plugin updates with rollback</li>
                            <li><i class="fas fa-check" aria-hidden="true"></i> Object caching (Redis) + Anycast DNS</li>
                            <li><i class="fas fa-check" aria-hidden="true"></i> Free WooCommerce performance tuning</li>
                            <li><i class="fas fa-check" aria-hidden="true"></i> Real-human review of every site every quarter</li>
                            <li><i class="fas fa-check" aria-hidden="true"></i> 99.9% uptime SLA backed in writing</li>
                        </ul>
                        <a href="pricing.html" class="btn btn-mw-primary">See Managed plans</a>
                    </div>
                    <div class="managed-card-visual">
                        <img src="./src/assets/ai-wordpress-optimizer.avif" alt="Fraylon managed WordPress dashboard showing performance and security metrics" loading="lazy">
                    </div>
                </div>
            </div>
        </section>

        <section class="wp-compat" aria-labelledby="wpCompatHeading">
            <div class="container">
                <div class="wp-compat-header">
                    <h2 id="wpCompatHeading">Works with the WordPress you already use</h2>
                    <p>Bring your themes, page builders, plugins, and integrations — Fraylon doesn't dictate your stack.</p>
                </div>
                <ul class="wp-compat-grid">
                    <li>WooCommerce</li><li>Elementor</li><li>Yoast SEO</li><li>Rank Math</li>
                    <li>WP Rocket</li><li>WPML</li><li>ACF</li><li>Gravity Forms</li>
                    <li>BuddyPress</li><li>LearnDash</li><li>TutorLMS</li><li>RankMath</li>
                </ul>
            </div>
        </section>
`;

// ─────────────── PRICING PAGE ───────────────
// Reuses index's plans grid mount + comparison table copied
const PRICING_BODY = `
        <section class="page-hero page-hero-pricing" aria-labelledby="pricingHero">
            <div class="page-hero-glow" aria-hidden="true"></div>
            <div class="container page-hero-container">
                <span class="page-eyebrow"><span class="eyebrow-pulse" aria-hidden="true"></span> Transparent pricing</span>
                <h1 id="pricingHero">Same price at renewal. Always.</h1>
                <p class="page-hero-lede">Pick a plan, pick a duration, and that's what you pay — this year, next year, the year after. No "promotional" pricing tricks.</p>
            </div>
        </section>

        <section class="mw-pricing" id="plans-section" aria-labelledby="plansHeading">
            <div class="container">
                <div class="mw-pricing-header">
                    <h2 id="plansHeading" class="sr-only">Hosting plans</h2>
                    <ul class="mw-trust-banner">
                        <li><i class="fas fa-check" aria-hidden="true"></i> Choose monthly or long-term</li>
                        <li><i class="fas fa-check" aria-hidden="true"></i> 24/7 expert support</li>
                        <li><i class="fas fa-check" aria-hidden="true"></i> 99.9% uptime guarantee</li>
                        <li><i class="fas fa-check" aria-hidden="true"></i> Free migration included</li>
                    </ul>

                    <div class="mw-duration-wrapper">
                        <label for="durationDropdown" id="durationLabel">Plan Duration</label>
                        <div class="mw-custom-dropdown" id="durationDropdown" tabindex="0" role="combobox" aria-haspopup="listbox" aria-expanded="false" aria-labelledby="durationLabel" aria-controls="durationOptions">
                            <div class="dropdown-selected">
                                <span class="selected-text">48 months</span>
                                <i class="fas fa-chevron-down" aria-hidden="true"></i>
                            </div>
                            <div class="dropdown-options" id="durationOptions" role="listbox" aria-label="Plan duration">
                                <div class="option" data-value="12" role="option" tabindex="-1" aria-selected="false">12 months</div>
                                <div class="option" data-value="24" role="option" tabindex="-1" aria-selected="false">24 months</div>
                                <div class="option" data-value="36" role="option" tabindex="-1" aria-selected="false">36 months</div>
                                <div class="option selected" data-value="48" role="option" tabindex="-1" aria-selected="true"><span>48 months</span><span class="best-value">BEST VALUE</span></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="mw-pricing-grid" id="plansGrid" aria-live="polite" aria-busy="false"></div>
                <p class="mw-gst-notice"><i class="fas fa-info-circle" aria-hidden="true"></i> All plan prices exclude 18% GST (added at checkout). Same price at renewal — guaranteed.</p>
            </div>
        </section>

        <section class="mw-comparison-section" aria-labelledby="cmpHeading">
            <div class="container">
                <div class="comparison-header">
                    <h2 id="cmpHeading">Fraylon vs others: who gives you more?</h2>
                    <p>How our standard Web Hosting compares to leading providers (lower is better for price, higher is better for everything else).</p>
                </div>
                <div class="comparison-table-wrapper">
                    <table class="comparison-table">
                        <thead>
                            <tr>
                                <th class="row-label"></th>
                                <th class="col-fraylon highlighted"><img src="logo.png" alt="Fraylon" class="table-logo"></th>
                                <th class="col-other"><img loading="lazy" src="./src/assets/hostinger.svg" alt="Hostinger" class="table-logo-small"></th>
                                <th class="col-other"><img loading="lazy" src="./src/assets/godaddy.svg" alt="GoDaddy" class="table-logo-small"></th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr><td class="row-label">Company origin: India</td><td class="col-fraylon highlighted"><i class="fas fa-check text-green"></i></td><td class="col-other"><i class="fas fa-times text-grey"></i></td><td class="col-other"><i class="fas fa-times text-grey"></i></td></tr>
                            <tr class="section-row"><td class="row-label">Price</td><td class="col-fraylon highlighted"></td><td class="col-other"></td><td class="col-other"></td></tr>
                            <tr><td class="row-label">Offer price</td><td class="col-fraylon highlighted"><span class="price-big">₹99/mo</span></td><td class="col-other">₹149.00/mo</td><td class="col-other">₹219.00/mo</td></tr>
                            <tr><td class="row-label">Renewal price</td><td class="col-fraylon highlighted"><span class="price-renewal">₹99.00/mo</span><span class="renewal-note">(Same price at renewal)</span></td><td class="col-other">₹449.00/mo <span class="price-increase">(300% increase)</span></td><td class="col-other">₹599.00/mo <span class="price-increase">(270% increase)</span></td></tr>
                            <tr class="section-row"><td class="row-label">Features</td><td class="col-fraylon highlighted"></td><td class="col-other"></td><td class="col-other"></td></tr>
                            <tr><td class="row-label">NVMe servers</td><td class="col-fraylon highlighted"><i class="fas fa-check text-green"></i></td><td class="col-other"><i class="fas fa-times text-grey"></i></td><td class="col-other"><i class="fas fa-check text-green"></i></td></tr>
                            <tr><td class="row-label">Website hosting limit</td><td class="col-fraylon highlighted"><span class="val-bold">25</span></td><td class="col-other">3</td><td class="col-other">1</td></tr>
                            <tr><td class="row-label">Advanced WordPress optimization</td><td class="col-fraylon highlighted"><i class="fas fa-check text-green"></i></td><td class="col-other"><i class="fas fa-times text-grey"></i></td><td class="col-other"><i class="fas fa-times text-grey"></i></td></tr>
                            <tr><td class="row-label">Email accounts</td><td class="col-fraylon highlighted"><span class="val-bold">Free</span></td><td class="col-other">Paid</td><td class="col-other">Free</td></tr>
                            <tr><td class="row-label">SSH access</td><td class="col-fraylon highlighted"><i class="fas fa-check text-green"></i></td><td class="col-other"><i class="fas fa-check text-green"></i></td><td class="col-other"><i class="fas fa-times text-grey"></i></td></tr>
                            <tr><td class="row-label">Daily backups</td><td class="col-fraylon highlighted"><i class="fas fa-check text-green"></i></td><td class="col-other"><i class="fas fa-check text-green"></i></td><td class="col-other"><i class="fas fa-times text-grey"></i></td></tr>
                            <tr><td class="row-label">Full website migration</td><td class="col-fraylon highlighted"><i class="fas fa-check text-green"></i></td><td class="col-other"><i class="fas fa-times text-grey"></i></td><td class="col-other"><i class="fas fa-times text-grey"></i></td></tr>
                        </tbody>
                        <tfoot>
                            <tr><td></td><td class="col-fraylon highlighted footer-row"><a href="cart.html" class="btn btn-mw-primary btn-sm">Get Started</a></td><td></td><td></td></tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        </section>

        <section class="cta-banner-section">
            <div class="cta-banner-container">
                <div class="cta-banner-card">
                    <div class="cta-banner-content">
                        <p class="cta-banner-label">Best Value Without Renewal Surprises</p>
                        <h2 class="cta-banner-headline">Save up to 80% today — pay<br>the same at renewal.</h2>
                        <a href="#plans-section" class="cta-banner-btn" data-fraylon-action="cta-claim">Claim Offer Now</a>
                        <p class="cta-banner-guarantee">30-day money-back guarantee &bull; No hidden charges</p>
                    </div>
                </div>
            </div>
        </section>
`;

// ─────────────── ABOUT US PAGE ───────────────
const ABOUT_BODY = `
        <section class="page-hero page-hero-about" aria-labelledby="aboutHero">
            <div class="page-hero-glow" aria-hidden="true"></div>
            <div class="container page-hero-container">
                <span class="page-eyebrow"><span class="eyebrow-pulse" aria-hidden="true"></span> About Fraylon</span>
                <h1 id="aboutHero">Built in Hyderabad. <span class="text-blue">Built for India.</span></h1>
                <p class="page-hero-lede">Fraylon Hosting is an Indian web hosting company — incorporated in December 2025 and headquartered in Hyderabad, Telangana. We host the websites of Indian founders, agencies and creators on infrastructure that finally lives close to home.</p>
                <div class="page-hero-actions">
                    <a href="pricing.html" class="btn btn-mw-primary">See our plans</a>
                    <a href="index.html#contact" class="btn btn-mw-secondary">Talk to us</a>
                </div>
            </div>
        </section>

        <section class="about-facts" aria-label="Company facts">
            <div class="container">
                <div class="about-facts-grid">
                    <div class="fact-card"><span class="fact-kicker">Founded</span><strong>December 2025</strong><span>Incorporated in Telangana</span></div>
                    <div class="fact-card"><span class="fact-kicker">HQ</span><strong>Hyderabad, India</strong><span>Banjara Hills · IST timezone</span></div>
                    <div class="fact-card"><span class="fact-kicker">Mission</span><strong>Honest hosting</strong><span>No renewal tricks. No upsell traps.</span></div>
                    <div class="fact-card"><span class="fact-kicker">Servers</span><strong>India + Singapore</strong><span>Low latency for SAARC traffic</span></div>
                </div>
            </div>
        </section>

        <section class="about-story" aria-labelledby="storyHeading">
            <div class="container about-story-grid">
                <div class="about-story-text">
                    <span class="page-eyebrow">Our story</span>
                    <h2 id="storyHeading">Why we started Fraylon</h2>
                    <p>We spent a decade running websites in India and watching the same script play out on every host: a beautiful intro price, a renewal hike, a support queue that didn't speak our timezone, and a control panel that felt designed for a different country.</p>
                    <p>Fraylon was built to fix all of that — local servers, local language support, prices that don't change at renewal, and a control panel that respects how Indian businesses actually run their sites.</p>
                    <p>If we sound a little stubborn about transparency, it's because we've been on the other side of the invoice.</p>
                </div>
                <aside class="about-story-aside">
                    <h3>What we'll never do</h3>
                    <ul>
                        <li><i class="fas fa-xmark" aria-hidden="true"></i> Raise your renewal price</li>
                        <li><i class="fas fa-xmark" aria-hidden="true"></i> Hide GST until checkout</li>
                        <li><i class="fas fa-xmark" aria-hidden="true"></i> Outsource support to a bot</li>
                        <li><i class="fas fa-xmark" aria-hidden="true"></i> Push you into a year you don't need</li>
                    </ul>
                    <h3>What we always will</h3>
                    <ul>
                        <li><i class="fas fa-check" aria-hidden="true"></i> Honour the price you signed up with</li>
                        <li><i class="fas fa-check" aria-hidden="true"></i> Reply in under 30 seconds on chat</li>
                        <li><i class="fas fa-check" aria-hidden="true"></i> Migrate your old site for free</li>
                        <li><i class="fas fa-check" aria-hidden="true"></i> Refund within 30 days, no questions</li>
                    </ul>
                </aside>
            </div>
        </section>

        <section class="about-pillars" aria-labelledby="pillarsHeading">
            <div class="container">
                <h2 id="pillarsHeading">What we care about</h2>
                <div class="pillars-grid">
                    <article class="pillar-card">
                        <div class="pillar-icon pillar-blue"><i class="fas fa-bolt" aria-hidden="true"></i></div>
                        <h3>Performance over marketing</h3>
                        <p>NVMe storage, LiteSpeed servers, HTTP/3 and AI-tuned caching by default. The fast version of your site is the version we ship.</p>
                    </article>
                    <article class="pillar-card">
                        <div class="pillar-icon pillar-amber"><i class="fas fa-shield-halved" aria-hidden="true"></i></div>
                        <h3>Security by default</h3>
                        <p>Free SSL, WAF, malware cleanup and daily off-site backups on every plan — even the cheapest. Security is not a paid add-on.</p>
                    </article>
                    <article class="pillar-card">
                        <div class="pillar-icon pillar-green"><i class="fas fa-headset" aria-hidden="true"></i></div>
                        <h3>Support that's actually local</h3>
                        <p>Real Fraylon engineers, based in Hyderabad, on IST. English and Hindi, on chat or ticket, 24/7. No outsourcing.</p>
                    </article>
                </div>
            </div>
        </section>

        <section class="about-hq" aria-labelledby="hqHeading">
            <div class="container about-hq-grid">
                <div>
                    <span class="page-eyebrow">HQ &amp; legal</span>
                    <h2 id="hqHeading">Headquartered in Hyderabad</h2>
                    <p>Fraylon Hosting Pvt. Ltd. was incorporated in December 2025 in Telangana, India. We operate from Hyderabad with a distributed support team across India and a primary data presence in Mumbai and Singapore.</p>
                    <dl class="hq-meta">
                        <div><dt>Registered office</dt><dd>Banjara Hills, Hyderabad, Telangana — 500034</dd></div>
                        <div><dt>Incorporation</dt><dd>December 2025</dd></div>
                        <div><dt>Working hours</dt><dd>Support 24/7 · Sales 9am – 9pm IST</dd></div>
                        <div><dt>Reach us</dt><dd><a href="mailto:support@fraylon.com">support@fraylon.com</a></dd></div>
                    </dl>
                </div>
                <div class="about-hq-card">
                    <img src="./src/assets/team_office1.png" alt="The Fraylon Hosting team at the Hyderabad office" loading="lazy">
                </div>
            </div>
        </section>

        <section class="cta-banner-section">
            <div class="cta-banner-container">
                <div class="cta-banner-card">
                    <div class="cta-banner-content">
                        <p class="cta-banner-label">Hosting from people you can reach</p>
                        <h2 class="cta-banner-headline">Ready to put your site on<br>an Indian host?</h2>
                        <a href="pricing.html" class="cta-banner-btn" data-fraylon-action="about-cta-plans">See the plans</a>
                        <p class="cta-banner-guarantee">30-day money-back &bull; Free migration &bull; Same price at renewal</p>
                    </div>
                </div>
            </div>
        </section>
`;

// ─────────────── 404 PAGE ───────────────
const NOTFOUND_BODY = `
        <section class="page-404">
            <div class="container">
                <div class="page-404-card">
                    <div class="page-404-code" aria-hidden="true">404</div>
                    <h1>This page took a wrong turn.</h1>
                    <p>The link you followed is broken, retired, or possibly never existed. Either way — you're a click away from somewhere useful.</p>
                    <div class="page-hero-actions">
                        <a href="index.html" class="btn btn-mw-primary">Back to home <i class="fas fa-arrow-right" aria-hidden="true"></i></a>
                        <a href="pricing.html" class="btn btn-mw-secondary">View plans</a>
                    </div>
                    <ul class="page-404-shortcuts">
                        <li><a href="hosting.html"><i class="fas fa-server" aria-hidden="true"></i> Hosting</a></li>
                        <li><a href="wordpress.html"><i class="fab fa-wordpress" aria-hidden="true"></i> WordPress</a></li>
                        <li><a href="pricing.html"><i class="fas fa-tag" aria-hidden="true"></i> Pricing</a></li>
                        <li><a href="about-us.html"><i class="fas fa-building" aria-hidden="true"></i> About</a></li>
                        <li><a href="index.html#contact"><i class="fas fa-headset" aria-hidden="true"></i> Support</a></li>
                    </ul>
                </div>
            </div>
        </section>
`;

// Write files
const targets = [
    { file: 'hosting.html', title: 'Hosting Plans — Web, Cloud & Node.js | Fraylon Hosting', description: 'Compare Fraylon Web Hosting, Cloud Hosting and Node.js Hosting. NVMe servers, LiteSpeed, free migrations and 24/7 support — same price at renewal.', activePage: 'hosting', bodyHtml: HOSTING_BODY },
    { file: 'wordpress.html', title: 'Managed WordPress Hosting — LiteSpeed + 1-click Install | Fraylon', description: 'Fraylon Managed WordPress Hosting: LiteSpeed, AI speed boost, 1-click install, free SSL, daily backups and built-in staging. Same price at renewal.', activePage: 'wordpress', bodyHtml: WORDPRESS_BODY },
    { file: 'pricing.html', title: 'Pricing & Plans — Same Price at Renewal | Fraylon Hosting', description: 'Transparent hosting pricing from ₹69/mo. Pick a plan, pick a duration — that price is locked at renewal. Compare Fraylon vs others on the same page.', activePage: 'pricing', bodyHtml: PRICING_BODY },
    { file: 'about-us.html', title: 'About Fraylon Hosting — Indian Web Host from Hyderabad', description: 'Fraylon Hosting was incorporated in December 2025 and is headquartered in Hyderabad, Telangana. Indian-built web hosting with honest pricing and human support.', activePage: 'about', bodyHtml: ABOUT_BODY },
    { file: '404.html', title: 'Page Not Found — Fraylon Hosting', description: 'The page you were looking for does not exist on Fraylon Hosting.', activePage: '', bodyHtml: NOTFOUND_BODY },
];

for (const t of targets) {
    const html = page(t);
    fs.writeFileSync(path.join(ROOT, t.file), html, 'utf8');
    console.log('wrote', t.file, '(' + html.length + ' chars)');
}
