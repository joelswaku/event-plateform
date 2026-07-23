// Temporary workaround: Update AI services to handle invalid keys gracefully

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Check if Anthropic key looks valid (basic format check)
function isValidAnthropicKey(key) {
  if (!key) return false;
  // Anthropic keys start with sk-ant-api03- and are much longer
  return key.startsWith('sk-ant-api03-') && key.length > 50;
}

// Mock for deployment - the real fix needs to be in the service files
console.log('Anthropic API Key validation helper');
console.log('Current key:', process.env.ANTHROPIC_API_KEY ? 'Set (masked)' : 'Not set');
console.log('Is valid format:', isValidAnthropicKey(process.env.ANTHROPIC_API_KEY));

if (!isValidAnthropicKey(process.env.ANTHROPIC_API_KEY)) {
  console.log('\n⚠️  ANTHROPIC_API_KEY is not set or invalid.');
  console.log('AI features will be disabled.');
  console.log('\nTo enable AI features:');
  console.log('1. Go to https://console.anthropic.com');
  console.log('2. Create an API key');
  console.log('3. Set ANTHROPIC_API_KEY in Railway');
}
