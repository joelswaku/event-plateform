// One key is kept for the lifetime of a checkout/donation sheet. Retrying the
// same action therefore resumes its original server-side payment session.
export function createPaymentRequestKey(prefix) {
  const uuid = globalThis.crypto?.randomUUID?.()
    ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  return `${prefix}-${uuid}`;
}
