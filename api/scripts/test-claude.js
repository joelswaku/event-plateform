import 'dotenv/config';
import { callClaude } from '../services/claude.service.js';

console.log('Calling Claude via Bedrock...');

const text = await callClaude({
  system: 'You are a helpful assistant.',
  prompt: 'Say hello in one sentence.',
});

console.log('Response:', text);
