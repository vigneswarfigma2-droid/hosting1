import { matchFaqLocally, analyzeSentiment } from '../server/lib/nlp.js';

console.log('--- NLP CORE TESTING ---');

// 1. Test Sentiment Analysis
const queries = [
    { text: "I love this hosting, it is amazing and fast!", expected: "Positive" },
    { text: "This is a basic normal day.", expected: "Neutral" },
    { text: "I am extremely angry, the server speed is terrible and support is bad", expected: "Negative" }
];

console.log('\n[Sentiment Analysis Test]:');
queries.forEach(q => {
    const score = analyzeSentiment(q.text);
    console.log(`Text: "${q.text}"`);
    console.log(`Score: ${score.toFixed(3)} (Expected: ${q.expected})\n`);
});

// 2. Test Semantic TF-IDF and Jaccard matching
const testFaqs = [
    "where is the datacenter?",
    "how much does the starter hosting cost?",
    "can I transfer my WordPress site for free?"
];

console.log('[Semantic Matcher Test]:');
testFaqs.forEach(query => {
    const match = matchFaqLocally(query);
    console.log(`Query: "${query}"`);
    if (match) {
        console.log(`Matched Topic: "${match.topicId}"`);
        console.log(`Response Preview: "${match.reply.substring(0, 100)}..."\n`);
    } else {
        console.log('No match found!\n');
    }
});
