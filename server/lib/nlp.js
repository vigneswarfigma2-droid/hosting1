import natural from 'natural';
import { GoogleGenerativeAI } from '@google/generative-ai';

const tokenizer = new natural.WordTokenizer();
const sentimentAnalyzer = new natural.SentimentAnalyzer('English', natural.PorterStemmer, 'afinn');

// Define Fraylon corporate knowledge base (No Emojis)
const FAQ_KNOWLEDGE_BASE = [
    {
        topicId: 'plans',
        document: 'pricing plans price cost cheap web hosting how much money rupees lists fees charges card packages starter premium max cloud pro duration selection options',
        reply: "We offer four premium web hosting plans designed for Indian websites:\n\n" +
              "• **Starter** (₹69/mo): Best for 1 basic website, includes 10GB NVMe storage and 1 email account.\n" +
              "• **Premium** (₹99/mo): Best value! Host up to 25 websites, free domain, 50GB storage, and 50 email accounts.\n" +
              "• **Max** (₹189/mo): Host up to 50 websites, Node.js/Python support, 100GB storage, and 150 email accounts.\n" +
              "• **Cloud Pro** (₹449/mo): High-performance cloud hosting, up to 100 websites, 150GB storage, and 40 Node.js apps.\n\n" +
              "All plans feature a **Price Lock Guarantee** — the price stays the same at renewal!",
        quickReplies: ["Help me choose a plan", "Is a free domain included?", "Do you support Node.js?"]
    },
    {
        topicId: 'migration',
        document: 'migrate migration transfer move files database domain backup zero downtime domain migration transfer website cpanel',
        reply: "Yes, we offer **100% free website migration** with zero downtime! Our experts will migrate your website files, databases, and emails from your old hosting provider. To request a migration, you can fill out the form by clicking 'My Account' or 'Request Migration' at the bottom of the page.",
        quickReplies: ["Help me choose a plan", "Tell me about security"]
    },
    {
        topicId: 'refund',
        document: 'refund money-back guarantee cancel money back policy return refund-policy risk-free satisfaction trial refunding',
        reply: "We provide a risk-free **30-day money-back guarantee** on all our hosting plans. If you are not fully satisfied with our services, you can request a refund within 30 days of purchase — no questions asked!",
        quickReplies: ["What plans do you have?", "Contact support"]
    },
    {
        topicId: 'support',
        document: 'support contact help phone chat email human call specialist response priority english hindi tickets hours live chat assistance helper assistant talk speak',
        reply: "We provide **24/7 expert human support** in English & Hindi. You can start a live chat via the header button or email us at support@fraylon.com. Our average response time is under 30 seconds!",
        quickReplies: ["What plans do you have?", "Refund Policy"]
    },
    {
        topicId: 'nodejs',
        document: 'node nodejs npm python django ruby backend custom apps programming framework rails scripts packages software library',
        reply: "Yes, we support Node.js, Python (Django/Flask), and Ruby! Node.js web applications can be hosted on our **Max** (₹189/mo) and **Cloud Pro** (₹449/mo) plans. The Starter and Premium plans are optimized for PHP and WordPress only.",
        quickReplies: ["Help me choose a plan", "Compare plans"]
    },
    {
        topicId: 'domain',
        document: 'domain free domain .com .in .net register renewal registry registration package website address registration',
        reply: "A **Free .com, .in, or .net Domain** is included for 1 year with our **Premium**, **Max**, and **Cloud Pro** plans when purchased for 12 months or longer. Domain renewal prices are also locked at standard registry rates.",
        quickReplies: ["Help me choose a plan", "What is the Starter plan?"]
    },
    {
        topicId: 'security',
        document: 'secure security ssl firewall backups ddos malware cleanup antivirus hack certificates access protection safety virus clean',
        reply: "Security is built-in! All Fraylon plans include: Free SSL certificates for all your websites, Web Application Firewall (WAF), enhanced DDoS protection, daily automated backups, and instant malware cleanup.",
        quickReplies: ["Compare plans", "Do you support Node.js?"]
    },
    {
        topicId: 'about',
        document: 'about company origin team who are we hyderabad india start launch foundation history founders developer design corporate culture',
        reply: "Fraylon Hosting is a proud Indian-built web hosting company launched in 2025, headquartered in Hyderabad, Telangana. We run high-performance LiteSpeed servers optimized specifically for fast load times in India.",
        quickReplies: ["Where are servers located?", "What plans do you have?"]
    },
    {
        topicId: 'servers',
        document: 'server datacenter location mumbai latency local speed fast geography center database hardware machine virtual compute location ping',
        reply: "Our high-speed NVMe servers are located in state-of-the-art datacenters in **Mumbai, India**. This ensures the lowest latency and fastest load times for your local Indian visitors!",
        quickReplies: ["Tell me about LiteSpeed", "Help me choose a plan"]
    },
    {
        topicId: 'litespeed',
        document: 'litespeed speed fast cdn performance cache lscache optimization loading time minutes scale website load page speed caching speed boost',
        reply: "We use LiteSpeed Enterprise Web Servers instead of Apache. Combined with LiteSpeed Cache (LSCache) and Object Caching, this delivers up to **20x faster page loading speeds** for WordPress and static sites!",
        quickReplies: ["What plans do you have?", "Do you offer free migration?"]
    }
];

// Construct and populate TF-IDF database (keyword documents only, NOT reply text)
const tfidf = new natural.TfIdf();
FAQ_KNOWLEDGE_BASE.forEach(faq => {
    tfidf.addDocument(faq.document.toLowerCase());
});

// Semantic Matching Core using TF-IDF
export function matchFaqLocally(query) {
    const queryLower = query.toLowerCase();
    const scores = [];

    tfidf.tfidfs(queryLower, (i, measure) => {
        scores.push({ index: i, score: measure });
    });

    // Sort descending
    scores.sort((a, b) => b.score - a.score);

    const best = scores[0];
    if (best && best.score > 0.15) {
        return FAQ_KNOWLEDGE_BASE[best.index];
    }

    // Token-overlap fuzzy Jaccard check as a backup
    const queryTokens = new Set(tokenizer.tokenize(queryLower));
    let bestJaccardIndex = -1;
    let bestJaccardScore = 0;

    FAQ_KNOWLEDGE_BASE.forEach((faq, idx) => {
        const docTokens = new Set(tokenizer.tokenize(faq.document.toLowerCase()));
        const intersection = new Set([...queryTokens].filter(x => docTokens.has(x)));
        const union = new Set([...queryTokens, ...docTokens]);
        const score = intersection.size / union.size;

        if (score > bestJaccardScore) {
            bestJaccardScore = score;
            bestJaccardIndex = idx;
        }
    });

    if (bestJaccardScore > 0.08) {
        return FAQ_KNOWLEDGE_BASE[bestJaccardIndex];
    }

    return null;
}

// Sentiment Analysis Core
export function analyzeSentiment(text) {
    try {
        const tokens = tokenizer.tokenize(text);
        if (!tokens || tokens.length === 0) return 0;
        return sentimentAnalyzer.getSentiment(tokens);
    } catch (e) {
        console.error('[nlp] Sentiment analysis error:', e);
        return 0;
    }
}

// Generative LLM Interface via Google Gemini (Emoji Free Context)
export async function getGeminiResponse(message, history = []) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || !apiKey.trim()) return null;

    const genAI = new GoogleGenerativeAI(apiKey);
    const systemInstruction = `
You are the Fraylon Support Assistant, a helpful and polite corporate chatbot for Fraylon Hosting (an Indian web hosting company founded in 2025 and headquartered in Hyderabad, Telangana).
Your task is to answer hosting questions accurately based ONLY on the Fraylon catalog details below. Do not make up external plans or features. If a user asks about something not related to hosting, redirect them politely to Fraylon Hosting topics.
Respond concisely (under 3-4 sentences if possible) and use bold text for plan names. Do NOT use any emojis in your responses.

--- FRAYLON CATALOG & DETAILS ---
1. Starter Plan: ₹69/mo, 1 website, 10 GB NVMe, 1 email. Optimized for PHP/WordPress. Billed upfront. Same price at renewal. No free domain. No Node.js.
2. Premium Plan: ₹99/mo, up to 25 websites, 50 GB NVMe, 50 emails, free .in/.com/.net domain for 1 year, bonus 3 months free. Optimized for PHP/WordPress. Billed upfront. Same price at renewal.
3. Max Plan: ₹189/mo, up to 50 websites, 100 GB NVMe, 150 emails, free domain, bonus 3 months free, Node.js & Python support. Billed upfront. Same price at renewal.
4. Cloud Pro Plan: ₹449/mo, up to 100 websites, 150 GB NVMe, 150 emails, free domain, Node.js & Python support. Billed upfront. Same price at renewal.
5. All plans include: 18% GST (added at checkout), 30-day money-back guarantee, free site/email/DB migrations with zero downtime, and Mumbai datacenter locations with LiteSpeed servers (20x performance).
6. Support: 24/7 expert human support in English and Hindi. Average chat response time: under 30 seconds.
--------------------------------
`;

    const model = genAI.getGenerativeModel({ 
        model: 'gemini-2.5-flash',
        systemInstruction: systemInstruction
    });

    // Build valid history for Gemini: must start with 'user' and strictly alternate user/model
    const recentHistory = history.slice(-10);

    // Drop leading bot messages — Gemini requires first message to be from 'user'
    let historyStart = 0;
    while (historyStart < recentHistory.length && recentHistory[historyStart].role !== 'user') {
        historyStart++;
    }
    const trimmedHistory = recentHistory.slice(historyStart);

    // Build strictly alternating pairs (user then model), skip any mismatched entries
    const formattedHistory = [];
    let expectRole = 'user';
    for (const h of trimmedHistory) {
        const geminiRole = h.role === 'user' ? 'user' : 'model';
        if (geminiRole === expectRole) {
            formattedHistory.push({ role: geminiRole, parts: [{ text: h.text }] });
            expectRole = expectRole === 'user' ? 'model' : 'user';
        }
        // Skip entries that break the alternation (e.g. two bots in a row)
    }

    // Helper: extract retryDelay seconds from a 429 error's errorDetails
    function getRetryDelaySecs(err) {
        try {
            const details = err?.errorDetails;
            if (!Array.isArray(details)) return 35;
            const retryInfo = details.find(d => d['@type']?.includes('RetryInfo'));
            if (retryInfo?.retryDelay) {
                // Format is "22s" or "31s"
                return parseInt(retryInfo.retryDelay) + 2;
            }
        } catch (_) {}
        return 35;
    }

    // Attempt Gemini call with one automatic retry on 429 rate-limit
    async function attemptCall() {
        const chat = model.startChat({ history: formattedHistory });
        const result = await chat.sendMessage(message);
        return result.response.text();
    }

    try {
        return await attemptCall();
    } catch (e) {
        if (e?.status === 429) {
            const waitSecs = getRetryDelaySecs(e);
            console.warn(`[nlp] Gemini rate-limited (429). Retrying in ${waitSecs}s...`);
            await new Promise(resolve => setTimeout(resolve, waitSecs * 1000));
            try {
                return await attemptCall();
            } catch (retryErr) {
                console.error('[nlp] Gemini retry also failed:', retryErr?.status || retryErr?.message);
                return null;
            }
        }
        console.error('[nlp] Gemini API Request failed:', e?.status || e?.message);
        return null;
    }
}
