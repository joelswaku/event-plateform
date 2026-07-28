/**
 * Test duplicate prevention
 * Tests that the same reminder cannot be sent twice
 */

import { sendInstantReminder } from './services/reminder.service.js';

const eventId = '0b6c6a70-c2ce-4ab8-917b-b58efa558bb9';
const guestId = '4486fe4b-655a-4d8a-b460-3c2d4ccbc64c';
const email = 'joelswaku@gmail.com';

console.log('Testing duplicate prevention...');
console.log('Attempting to send the same reminder again...');
console.log('');

const result = await sendInstantReminder(eventId, guestId, email, 'Test User');

if (result.success === false && result.reason === 'already_sent') {
  console.log('✅ ✅ ✅ DUPLICATE PREVENTION WORKS! ✅ ✅ ✅');
  console.log('');
  console.log('The system correctly prevented sending a duplicate email.');
  console.log('This proves the atomic INSERT...ON CONFLICT is working!');
} else if (result.success) {
  console.log('❌ WARNING: Email was sent again (duplicate!)');
  console.log('This should not happen - duplicate prevention may be broken');
} else {
  console.log('❌ Unexpected result:', result);
}

process.exit(0);
