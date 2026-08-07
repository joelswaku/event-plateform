/**
 * Event Reminder Email Template
 *
 * Built with table layout and solid, light surfaces so the message stays
 * readable in Gmail, including Gmail's automatic dark-mode treatment.
 */

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function safeUrl(value) {
  try {
    const url = new URL(String(value));
    return ['http:', 'https:'].includes(url.protocol) ? url.toString() : '#';
  } catch {
    return '#';
  }
}

export function generateReminderEmail({
  guestName,
  eventTitle,
  eventDate,
  eventTime,
  eventLocation,
  eventUrl,
  message,
  timing,
}) {
  const timingLabels = {
    instant: 'Registration confirmed',
    '1_minute': '1 minute',
    '15_minutes': '15 minutes',
    '30_minutes': '30 minutes',
    '1_hour': '1 hour',
    '2_hours': '2 hours',
    '6_hours': '6 hours',
    '12_hours': '12 hours',
    '24_hours': '24 hours',
    '3_days': '3 days',
    '7_days': '1 week',
    '14_days': '2 weeks',
    '30_days': '1 month',
  };

  const isConfirmation = timing === 'instant';
  const timingLabel = timingLabels[timing] || 'Event reminder';
  const safe = {
    guestName: escapeHtml(guestName || 'there'),
    eventTitle: escapeHtml(eventTitle || 'Your event'),
    eventDate: escapeHtml(eventDate),
    eventTime: escapeHtml(eventTime),
    eventLocation: escapeHtml(eventLocation),
    eventUrl: escapeHtml(safeUrl(eventUrl)),
    message: escapeHtml(message || ''),
  };
  const mapUrl = eventLocation
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(String(eventLocation))}`
    : '';

  const dateRow = eventDate ? `
    <tr>
      <td width="38" valign="top" style="padding: 0 12px 0 0;">
        <div style="width: 32px; height: 32px; line-height: 32px; text-align: center; background-color: #eef2ff; border-radius: 8px; color: #4338ca; font-size: 15px;">&#128197;</div>
      </td>
      <td valign="top" style="padding: 0;">
        <p style="margin: 0 0 3px; color: #6b7280; font-size: 11px; font-weight: 700; letter-spacing: 0.9px; line-height: 16px; text-transform: uppercase;">Date &amp; time</p>
        <p style="margin: 0; color: #111827; font-size: 16px; font-weight: 700; line-height: 23px;">${safe.eventDate}${eventTime ? ` at ${safe.eventTime}` : ''}</p>
      </td>
    </tr>` : '';

  const locationRow = eventLocation ? `
    <tr>
      <td colspan="2" style="padding: ${eventDate ? '20px' : '0'} 0 0;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
          <tr>
            <td width="38" valign="top" style="padding: 0 12px 0 0;">
              <div style="width: 32px; height: 32px; line-height: 32px; text-align: center; background-color: #f5f3ff; border-radius: 8px; color: #6d28d9; font-size: 15px;">&#128205;</div>
            </td>
            <td valign="top" style="padding: 0;">
              <p style="margin: 0 0 3px; color: #6b7280; font-size: 11px; font-weight: 700; letter-spacing: 0.9px; line-height: 16px; text-transform: uppercase;">Location</p>
              <a href="${escapeHtml(mapUrl)}" style="color: #111827; font-size: 16px; font-weight: 700; line-height: 23px; text-decoration: none;">${safe.eventLocation}</a>
              <br>
              <a href="${escapeHtml(mapUrl)}" style="color: #4f46e5; font-size: 13px; font-weight: 700; line-height: 20px; text-decoration: none;">Open in Maps &rarr;</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>` : '';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="ie=edge">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>${safe.eventTitle}</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td, a { font-family: Arial, Helvetica, sans-serif !important; }
  </style>
  <![endif]-->
</head>
<body class="body" style="margin: 0; padding: 0; background-color: #f3f4f6;">
  <div style="display: none; max-height: 0; overflow: hidden; opacity: 0; color: transparent; mso-hide: all;">
    ${isConfirmation ? `You're registered for ${safe.eventTitle}.` : `${timingLabel} until ${safe.eventTitle}.`}
  </div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width: 100%; background-color: #f3f4f6;">
    <tr>
      <td align="center" style="padding: 32px 16px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="width: 100%; max-width: 600px; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 16px; overflow: hidden;">

          <tr>
            <td style="padding: 24px 32px 18px; border-bottom: 1px solid #e5e7eb;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td valign="middle">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td width="28" height="28" align="center" valign="middle" style="width: 28px; height: 28px; background-color: #4f46e5; border-radius: 8px; color: #ffffff; font-family: Arial, sans-serif; font-size: 17px; font-weight: 700; line-height: 28px;">L</td>
                        <td style="padding-left: 9px; color: #111827; font-family: Arial, Helvetica, sans-serif; font-size: 17px; font-weight: 800; letter-spacing: -0.2px;">LiteEvent</td>
                      </tr>
                    </table>
                  </td>
                  <td align="right" valign="middle" style="color: #6b7280; font-family: Arial, Helvetica, sans-serif; font-size: 12px; font-weight: 600;">${isConfirmation ? 'Event registration' : 'Event reminder'}</td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding: 38px 32px 26px;">
              <p style="margin: 0 0 14px; color: #4f46e5; font-family: Arial, Helvetica, sans-serif; font-size: 12px; font-weight: 800; letter-spacing: 1px; line-height: 18px; text-transform: uppercase;">${isConfirmation ? '&#10003; Registration confirmed' : `&#128276; ${escapeHtml(timingLabel)} until your event`}</p>
              <h1 style="margin: 0; color: #111827; font-family: Arial, Helvetica, sans-serif; font-size: 30px; font-weight: 800; letter-spacing: -0.6px; line-height: 38px;">${isConfirmation ? "You're registered." : 'A quick reminder.'}</h1>
              <p style="margin: 12px 0 0; color: #4b5563; font-family: Arial, Helvetica, sans-serif; font-size: 16px; line-height: 25px;">Everything you need for the event is below.</p>
            </td>
          </tr>

          <tr>
            <td style="padding: 0 32px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #fafafa; border: 1px solid #e5e7eb; border-radius: 12px;">
                <tr>
                  <td style="padding: 24px;">
                    <p style="margin: 0 0 20px; color: #111827; font-family: Arial, Helvetica, sans-serif; font-size: 20px; font-weight: 800; letter-spacing: -0.3px; line-height: 28px;">${safe.eventTitle}</p>
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                      ${dateRow}
                      ${locationRow}
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding: 30px 32px 12px;">
              <p style="margin: 0 0 14px; color: #111827; font-family: Arial, Helvetica, sans-serif; font-size: 16px; font-weight: 700; line-height: 24px;">Hi ${safe.guestName},</p>
              <p style="margin: 0; color: #4b5563; font-family: Arial, Helvetica, sans-serif; font-size: 16px; line-height: 26px;">${safe.message}</p>
            </td>
          </tr>

          <tr>
            <td align="left" style="padding: 24px 32px 38px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="center" bgcolor="#4f46e5" style="background-color: #4f46e5; border-radius: 10px;">
                    <a href="${safe.eventUrl}" style="display: inline-block; padding: 14px 20px; color: #ffffff; font-family: Arial, Helvetica, sans-serif; font-size: 15px; font-weight: 700; line-height: 20px; text-decoration: none;">View event details &rarr;</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding: 22px 32px 28px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 8px; color: #6b7280; font-family: Arial, Helvetica, sans-serif; font-size: 12px; line-height: 18px;">You are receiving this because you registered for this event.</p>
              <p style="margin: 0; color: #9ca3af; font-family: Arial, Helvetica, sans-serif; font-size: 12px; line-height: 18px;">Powered by LiteEvent &middot; &copy; ${new Date().getFullYear()} LiteEvent</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();
}

// Plain-text fallback for email clients that don't render HTML.
export function generateReminderTextEmail({
  guestName,
  eventTitle,
  eventDate,
  eventTime,
  eventLocation,
  eventUrl,
  message,
}) {
  return `
Hi ${guestName || 'there'},

${message}

EVENT DETAILS
━━━━━━━━━━━━━━━━━━━━━━
${eventTitle}

${eventDate ? `Date: ${eventDate}${eventTime ? ` at ${eventTime}` : ''}` : ''}
${eventLocation ? `Location: ${eventLocation}` : ''}

View full event details:
${eventUrl}

━━━━━━━━━━━━━━━━━━━━━━
Powered by LiteEvent
You're receiving this because you're registered for this event.

© ${new Date().getFullYear()} LiteEvent. All rights reserved.
  `.trim();
}
