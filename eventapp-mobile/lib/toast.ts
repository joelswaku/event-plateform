import Toast from 'react-native-toast-message';

// ─── Core helpers ─────────────────────────────────────────────────────────────

export const toast = {
  success: (text1: string, text2?: string) =>
    Toast.show({ type: 'success', text1, text2, visibilityTime: 3000, topOffset: 56 }),

  error: (text1: string, text2?: string) =>
    Toast.show({ type: 'error', text1, text2, visibilityTime: 4500, topOffset: 56 }),

  info: (text1: string, text2?: string) =>
    Toast.show({ type: 'info', text1, text2, visibilityTime: 3500, topOffset: 56 }),

  warning: (text1: string, text2?: string) =>
    Toast.show({ type: 'warning', text1, text2, visibilityTime: 4000, topOffset: 56 }),
};

// ─── Smart error parser ───────────────────────────────────────────────────────
// Converts raw API / network errors into friendly, human-readable messages.

function parseApiError(raw?: string): { title: string; subtitle?: string } {
  if (!raw) return { title: 'Something went wrong', subtitle: 'Please try again.' };

  const msg = raw.toLowerCase();

  // Auth errors
  if (msg.includes('invalid credentials') || msg.includes('wrong password') || msg.includes('incorrect password'))
    return { title: 'Incorrect email or password', subtitle: 'Double-check your details and try again.' };
  if (msg.includes('email already') || msg.includes('already exists') || msg.includes('duplicate'))
    return { title: 'Account already exists', subtitle: 'Try signing in instead.' };
  if (msg.includes('not found') && msg.includes('user'))
    return { title: 'Account not found', subtitle: 'Check your email or create an account.' };
  if (msg.includes('token expired') || msg.includes('session expired'))
    return { title: 'Session expired', subtitle: 'Please sign in again.' };
  if (msg.includes('unauthorized') || msg.includes('not authorized') || msg.includes('authentication required'))
    return { title: 'Sign in required', subtitle: 'Please sign in to continue.' };

  // Network & server errors
  if (msg.includes('network') || msg.includes('connect') || msg.includes('timeout') || msg.includes('econnrefused'))
    return { title: 'Connection issue', subtitle: 'Check your internet and try again.' };
  if (msg.includes('500') || msg.includes('internal server'))
    return { title: 'Server error', subtitle: 'We\'re on it. Please try again shortly.' };
  if (msg.includes('429') || msg.includes('too many requests') || msg.includes('rate limit'))
    return { title: 'Slow down', subtitle: 'Too many requests. Wait a moment and retry.' };

  // Google / Places API errors
  if (msg.includes('api key') || msg.includes('key not valid') || msg.includes('invalid key'))
    return { title: 'Location search unavailable', subtitle: 'Please try again later.' };
  if (msg.includes('places api') || msg.includes('not been used') || msg.includes('disabled'))
    return { title: 'Location search unavailable', subtitle: 'Service is temporarily down.' };
  if (msg.includes('permission_denied') || msg.includes('request_denied'))
    return { title: 'Location search unavailable', subtitle: 'Please try again later.' };

  // Stripe / Payment errors
  if (msg.includes('card') && (msg.includes('declined') || msg.includes('invalid')))
    return { title: 'Payment declined', subtitle: 'Check your card details and try again.' };
  if (msg.includes('payment') && msg.includes('fail'))
    return { title: 'Payment failed', subtitle: 'Please try a different payment method.' };

  // Validation
  if (msg.includes('required'))
    return { title: 'Missing information', subtitle: 'Please fill in all required fields.' };
  if (msg.includes('invalid email'))
    return { title: 'Invalid email', subtitle: 'Enter a valid email address.' };

  // Fallback — keep the original if it's short and readable
  if (raw.length <= 80 && !raw.includes('http') && !raw.includes('stack'))
    return { title: raw };

  return { title: 'Something went wrong', subtitle: 'Please try again.' };
}

// ─── Semantic helpers ─────────────────────────────────────────────────────────

export const showError = (rawOrTitle: string, subtitle?: string) => {
  if (subtitle !== undefined) {
    toast.error(rawOrTitle, subtitle);
  } else {
    const { title, subtitle: sub } = parseApiError(rawOrTitle);
    toast.error(title, sub);
  }
};

export const showSuccess = (text1: string, text2?: string) => toast.success(text1, text2);
export const showInfo    = (text1: string, text2?: string) => toast.info(text1, text2);
export const showWarning = (text1: string, text2?: string) => toast.warning(text1, text2);

// ─── Domain-specific messages ─────────────────────────────────────────────────

export const notify = {
  // Auth
  loginFailed:     (err?: string) => showError(err || 'Login failed'),
  registerSuccess:               () => toast.success('Account created!', 'Welcome! Please sign in.'),
  registerFailed:  (err?: string) => showError(err || 'Could not create account'),
  loggedOut:                     () => toast.info('Signed out', 'See you next time!'),
  sessionExpired:                () => toast.warning('Session expired', 'Please sign in again.'),

  // Events
  eventCreated:   (title?: string) => toast.success('Event created!', title),
  eventSaved:                      () => toast.success('Changes saved'),
  eventFailed:    (err?: string)   => showError(err || 'Could not save event'),
  eventDeleted:                    () => toast.info('Event deleted'),

  // Tickets
  ticketCreated:   () => toast.success('Ticket type created'),
  ticketUpdated:   () => toast.success('Ticket type updated'),
  ticketFailed:    () => toast.error('Could not save ticket', 'Check the details and try again.'),
  ticketRequired:  () => toast.error('Ticket name required', 'Enter a name for this ticket type.'),

  // Guests
  guestAdded:      (name?: string) => toast.success('Guest added', name),
  guestUpdated:                    () => toast.success('Guest updated'),
  guestDeleted:    (count = 1)     => toast.success(count === 1 ? 'Guest removed' : `${count} guests removed`),
  guestFailed:                     () => toast.error('Could not add guest', 'Check the details and try again.'),
  nameRequired:                    () => toast.error('Name required', 'Enter the guest\'s full name.'),
  invitesSent:     (count = 1)     => toast.success(`Invitation${count !== 1 ? 's' : ''} sent`, `${count} guest${count !== 1 ? 's' : ''} notified.`),
  invitesFailed:                   () => toast.error('Could not send invitations', 'Please try again.'),
  rsvpUpdated:     (status: string, count = 1) => toast.success('RSVP updated', `${count} guest${count !== 1 ? 's' : ''} marked as ${status.toLowerCase()}.`),
  rsvpFailed:                      () => toast.error('Could not update RSVP', 'Please try again.'),
  bulkDeleteFailed:                () => toast.error('Could not delete guests', 'Please try again.'),

  // Scanner
  checkinSuccess:  (name?: string) => toast.success('Checked in!', name),
  checkinDuplicate:(name?: string) => toast.warning('Already checked in', name),
  noEventSelected:                 () => toast.info('No event selected', 'Tap the selector above to choose an event.'),
  eventSelected:   (title?: string)=> toast.success('Event selected', title),

  // Planner
  projectSaved:                    () => toast.success('Project saved'),
  projectDeleted:                  () => toast.info('Project deleted'),
  projectArchived:                 () => toast.success('Project archived'),
  projectFailed:   (err?: string)  => showError(err || 'Could not save project'),
  taskDeleted:                     () => toast.success('Task removed'),
  taskFailed:                      () => toast.error('Could not delete task', 'Please try again.'),
  titleRequired:                   () => toast.error('Title required', 'Enter a title to continue.'),

  // Vendors
  vendorAdded:     (name?: string) => toast.success('Vendor added', name),
  vendorUpdated:                   () => toast.success('Vendor updated'),
  vendorRemoved:                   () => toast.success('Vendor removed'),
  vendorFailed:    (err?: string)  => showError(err || 'Could not save vendor'),
  vendorSearchFailed: (err?: string) => {
    const { title, subtitle } = parseApiError(err || 'search failed');
    toast.error(title, subtitle ?? 'Try a different location or category.');
  },

  // Budget
  budgetItemAdded:  () => toast.success('Budget item added'),
  budgetItemFailed: (err?: string) => showError(err || 'Could not add budget item'),

  // Team
  memberInvited:   () => toast.success('Invitation sent'),
  memberRemoved:   () => toast.success('Member removed'),
  memberFailed:    (err?: string) => showError(err || 'Could not update team member'),

  // Files
  fileAdded:  () => toast.success('File added'),
  fileFailed: (err?: string) => showError(err || 'Could not add file'),

  // AI
  aiComplete: () => toast.success('AI generation complete'),
  aiFailed:   (err?: string) => toast.error('Generation failed', err ?? 'Please try again.'),

  // Settings
  settingsSaved:  () => toast.success('Settings saved'),
  settingsFailed: (err?: string) => showError(err || 'Could not save settings'),

  // Password reset
  resetEmailSent: () => toast.success('Check your inbox', 'Password reset instructions sent.'),
  resetFailed:    () => toast.error('Could not send reset email', 'Check your email address and try again.'),
};
