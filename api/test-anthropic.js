const key = process.env.ANTHROPIC_API_KEY;
const isValid = key && key.startsWith('sk-ant-api03-') && key.length > 50;

console.log('✓ Anthropic API Key configured');
console.log('  Prefix:', key?.substring(0, 20) + '...');
console.log('  Valid format:', isValid);
console.log('  Length:', key?.length);

process.exit(isValid ? 0 : 1);
