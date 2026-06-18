import express from 'express';
import { logger } from '../lib/logger.js';
import { matchFaqLocally, analyzeSentiment, getGeminiResponse } from '../lib/nlp.js';

const router = express.Router();

// Static responses for standard fallback
const FALLBACK_RESPONSE = {
    reply: "I'm not sure I fully understand that. I'm trained to help with Fraylon hosting plans, pricing, migrations, and technical specs. Would you like to use our plan recommendation guide or speak to human support?",
    quickReplies: ["Help me choose a plan", "What plans do you have?", "Contact support"]
};

// Wizard Questionnaire Steps (No Emojis)
router.post('/message', async (req, res) => {
    const { message, state = {}, history = [] } = req.body;
    
    if (!message || typeof message !== 'string') {
        return res.status(400).json({ error: "Message is required." });
    }

    const msg = message.toLowerCase().trim();
    logger.info(`Chatbot message: "${message}" [State: ${JSON.stringify(state)}]`);

    // 1. Perform Sentiment Analysis
    const sentimentScore = analyzeSentiment(message);
    logger.info(`Sentiment score for query: ${sentimentScore}`);
    
    let sentimentEscalation = "";
    if (sentimentScore < -0.3) {
        sentimentEscalation = "\n\n*(It sounds like you might be having a difficult experience. If you need immediate human help, please click 'Contact support' below to speak to our 24/7 team!)*";
    }

    // 1.5. Handle AI Support Agent Mode
    const isAgentRequest = msg.includes('connect') && (msg.includes('agent') || msg.includes('human') || msg.includes('support') || msg.includes('live'))
        || (msg.includes('talk') || msg.includes('speak') || msg.includes('chat')) && (msg.includes('agent') || msg.includes('human') || msg.includes('person') || msg.includes('someone'))
        || msg === 'agent' || msg === 'human support' || msg === 'contact support' || msg === 'live support' || msg === 'live chat';

    if (isAgentRequest && !state.agentMode) {
        const nextState = { ...state, agentMode: true, wizardStep: null, websites: null, nodejs: null };
        return res.json({
            reply: "I am connecting you to our **Fraylon AI Support Agent**. I can now chat with you freely about Fraylon's services, plans, migrations, or datacenters.\n\nHow can I help you today? *(Type **exit** at any time to return to the main menu)*",
            quickReplies: ["What plans do you have?", "Do you offer free migration?", "Tell me about datacenters", "Exit Agent Mode"],
            state: nextState
        });
    }

    if (state.agentMode) {
        if (msg === 'exit agent mode' || msg === 'exit' || msg === 'return' || msg === 'main menu') {
            const nextState = { ...state, agentMode: null };
            return res.json({
                reply: "You have exited AI Agent Mode. How else can I assist you today?",
                quickReplies: ["Help me choose a plan", "What plans do you have?", "Contact support"],
                state: nextState
            });
        }

        const geminiReply = await getGeminiResponse(message, history);
        if (geminiReply) {
            return res.json({
                reply: geminiReply + sentimentEscalation,
                quickReplies: ["Compare plans", "Contact support", "Exit Agent Mode"],
                state: state
            });
        } else {
            return res.json({
                reply: "I'm having difficulty reaching our AI systems right now. What would you like to know about our web hosting services? Or type 'exit' to go back." + sentimentEscalation,
                quickReplies: ["Compare plans", "Contact support", "Exit Agent Mode"],
                state: state
            });
        }
    }

    // 2. Handle Wizard Step: websites
    if (state.wizardStep === 'websites') {
        let websitesVal = null;
        if (msg.includes('1') || msg.includes('one') || msg.includes('single')) {
            websitesVal = 1;
        } else if (msg.includes('25') || msg.includes('2') || msg.includes('two') || msg.includes('few') || msg.includes('several')) {
            websitesVal = 25;
        } else if (msg.includes('50') || msg.includes('many') || msg.includes('medium')) {
            websitesVal = 50;
        } else if (msg.includes('more') || msg.includes('100') || msg.includes('large')) {
            websitesVal = 100;
        } else {
            const match = msg.match(/\d+/);
            websitesVal = match ? parseInt(match[0], 10) : 25;
        }

        const nextState = { ...state, wizardStep: 'nodejs', websites: websitesVal };
        return res.json({
            reply: `Got it: you want to host ${websitesVal === 1 ? '1 website' : 'up to ' + websitesVal + ' websites'}.\n\n` +
                   `Next question: Do you need to host **Node.js** web applications? (Starter and Premium plans support PHP/WordPress only; Max and Cloud Pro support Node.js/Python).`,
            quickReplies: ["Yes, I need Node.js", "No, just WordPress/PHP"],
            state: nextState
        });
    }

    // 3. Handle Wizard Step: nodejs
    if (state.wizardStep === 'nodejs') {
        const needsNodejs = msg.includes('yes') || msg.includes('node');
        const websites = state.websites || 1;
        
        let recommendedId = 'premium';
        let explanation = '';

        if (needsNodejs) {
            if (websites > 50) {
                recommendedId = 'cloud-pro';
                explanation = "Since you need to run Node.js applications and host more than 50 websites, the **Cloud Pro plan** (₹449/mo) is the perfect fit. It offers full Node.js support, 150 GB NVMe storage, and scalable resources.";
            } else {
                recommendedId = 'max';
                explanation = "Since you need to run Node.js applications and host up to 50 websites, the **Max plan** (₹189/mo) is the best match. It includes full Node.js app management and 100 GB NVMe storage.";
            }
        } else {
            if (websites === 1) {
                recommendedId = 'starter';
                explanation = "Since you only need to host a single website and do not require Node.js, the **Starter plan** (₹69/mo) is the most budget-friendly choice. It includes 10 GB storage and 1 email address.";
            } else if (websites <= 25) {
                recommendedId = 'premium';
                explanation = "The **Premium plan** (₹99/mo) is our absolute best value. You can host up to 25 websites, get a free domain, and plenty of NVMe SSD storage.";
            } else if (websites <= 50) {
                recommendedId = 'max';
                explanation = "Since you host up to 50 websites, the **Max plan** (₹189/mo) is the ideal option. It handles up to 50 websites and offers daily automatic backups.";
            } else {
                recommendedId = 'cloud-pro';
                explanation = "For hosting more than 50 websites, the **Cloud Pro plan** (₹449/mo) provides high-performance enterprise resources and advanced features.";
            }
        }

        const planName = recommendedId.charAt(0).toUpperCase() + recommendedId.slice(1).replace('-', ' ');
        const checkoutUrl = `cart.html?plan=${recommendedId}&duration=48`;

        return res.json({
            reply: `${explanation}\n\n` +
                   `**Recommended Plan: ${planName}**\n` +
                   `Would you like to start with this plan today?`,
            quickReplies: [`Order ${planName} Now`, "Restart Guide", "Main Menu"],
            state: { wizardStep: null, websites: null, nodejs: null },
            recommendation: {
                planId: recommendedId,
                checkoutUrl
            }
        });
    }

    // 4. Trigger Recommendation Wizard
    if (msg.includes('choose') || msg.includes('wizard') || msg.includes('guide') || msg.includes('recommend') || msg.includes('help me choose') || msg.includes('suggest')) {
        return res.json({
            reply: "Let's find the best plan for you! I will ask you two simple questions.\n\nFirst: **How many websites do you plan to host?**",
            quickReplies: ["1 website", "2 to 25 websites", "26 to 50 websites", "More than 50 websites"],
            state: { wizardStep: 'websites', websites: null, nodejs: null }
        });
    }

    // 5. Handle Direct Order request chips
    if (msg.startsWith('order ')) {
        const planPart = msg.substring(6).replace('now', '').trim();
        let planId = '';
        let planName = '';

        if (planPart.includes('starter')) { planId = 'starter'; planName = 'Starter'; }
        else if (planPart.includes('premium')) { planId = 'premium'; planName = 'Premium'; }
        else if (planPart.includes('max')) { planId = 'max'; planName = 'Max'; }
        else if (planPart.includes('cloud')) { planId = 'cloud-pro'; planName = 'Cloud Pro'; }

        if (planId) {
            return res.json({
                reply: `You have chosen to order the Fraylon **${planName}** plan. Click the button below to complete your checkout at the locked price.`,
                quickReplies: ["Restart Guide", "Main Menu"],
                recommendation: {
                    planId,
                    checkoutUrl: `cart.html?plan=${planId}&duration=48`
                }
            });
        }
    }

    // 6. Local Semantic NLP Matching (fast, no API quota used)
    const localMatch = matchFaqLocally(message);
    if (localMatch) {
        return res.json({
            reply: localMatch.reply + sentimentEscalation,
            quickReplies: localMatch.quickReplies,
            state: { wizardStep: null, websites: null, nodejs: null }
        });
    }

    // 7. GenAI (Google Gemini) — only called when local NLP finds no confident match
    const geminiReply = await getGeminiResponse(message, history);
    if (geminiReply) {
        return res.json({
            reply: geminiReply + sentimentEscalation,
            quickReplies: ["Help me choose a plan", "What plans do you have?", "Contact support"],
            state: { wizardStep: null, websites: null, nodejs: null }
        });
    }

    // 8. Default Fallback response
    return res.json({
        reply: FALLBACK_RESPONSE.reply + sentimentEscalation,
        quickReplies: FALLBACK_RESPONSE.quickReplies,
        state: { wizardStep: null, websites: null, nodejs: null }
    });
});

export default router;
