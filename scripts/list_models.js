import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
    console.error('No GEMINI_API_KEY found in .env');
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

async function listModels() {
    try {
        console.log('Fetching available models from Google AI Studio...');
        // To list models, we can use the genAI client or fetch directly.
        // Let's use direct fetch to avoid potential SDK version limitations.
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        console.log('\n--- Supported Models ---');
        data.models.forEach(model => {
            console.log(`- ${model.name} (${model.displayName})`);
            console.log(`  Supported methods: ${model.supportedGenerationMethods.join(', ')}`);
        });
    } catch (err) {
        console.error('Failed to list models:', err);
    }
}

listModels();
