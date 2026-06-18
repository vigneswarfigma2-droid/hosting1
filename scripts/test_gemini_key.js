import dotenv from 'dotenv';
import { getGeminiResponse } from '../server/lib/nlp.js';

// Load environmental variables
dotenv.config();

console.log('API KEY PREVIEW:', process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.substring(0, 8) + '...' : 'None');

async function checkKey() {
    try {
        console.log('Sending test prompt to Google Gemini API...');
        const response = await getGeminiResponse("Tell me briefly about Fraylon Starter plan.");
        console.log('\n--- GEMINI RESPONSE ---');
        console.log(response);
        console.log('-----------------------');
        if (response) {
            console.log('SUCCESS: Gemini API is working with the configured key!');
        } else {
            console.log('FAILURE: No response received.');
        }
    } catch (err) {
        console.error('API Error:', err);
    }
}

checkKey();
