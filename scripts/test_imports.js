import natural from 'natural';
import { GoogleGenerativeAI } from '@google/generative-ai';

console.log('Imports check:');
console.log('Natural:', Object.keys(natural).slice(0, 10));
console.log('GoogleGenerativeAI:', typeof GoogleGenerativeAI);
