import { getGeminiResponse } from '../server/lib/nlp.js';

console.log('--- GEMINI FALLBACK TESTING ---');

async function test() {
    // Test Scenario A: GEMINI_API_KEY is blank
    process.env.GEMINI_API_KEY = '';
    console.log('\n[Scenario A: API Key is blank]');
    const responseA = await getGeminiResponse("Hello");
    console.log(`Response: ${responseA} (Expected: null)`);

    // Test Scenario B: GEMINI_API_KEY is invalid/dummy
    process.env.GEMINI_API_KEY = 'invalid-dummy-key-abc';
    console.log('\n[Scenario B: API Key is invalid]');
    console.log('Sending message to Gemini API (expecting API network failure)...');
    
    // We expect it to catch the API key verification error internally and return null
    const responseB = await getGeminiResponse("Hello");
    console.log(`Response: ${responseB} (Expected: null/failure handled gracefully)`);
}

test();
