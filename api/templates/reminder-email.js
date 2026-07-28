/**
 * Event Reminder Email Template
 * Beautiful, responsive HTML email for event reminders
 */

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
    'instant': 'Registration Confirmed',
    '1_minute': '1 Minute',
    '15_minutes': '15 Minutes',
    '30_minutes': '30 Minutes',
    '1_hour': '1 Hour',
    '2_hours': '2 Hours',
    '6_hours': '6 Hours',
    '12_hours': '12 Hours',
    '24_hours': '24 Hours',
    '3_days': '3 Days',
    '7_days': '1 Week',
    '14_days': '2 Weeks',
    '30_days': '1 Month',
  };

  const timingLabel = timingLabels[timing] || 'Reminder';
  const isConfirmation = timing === 'instant';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="ie=edge">
  <title>Event Reminder - ${eventTitle}</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td {font-family: Arial, Helvetica, sans-serif !important;}
  </style>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #f4f7fa; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">

  <!-- Wrapper Table -->
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f4f7fa; padding: 40px 20px;">
    <tr>
      <td align="center">

        <!-- Main Container -->
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 24px rgba(0,0,0,0.06); overflow: hidden;">

          <!-- Header with Gradient -->
          <tr>
            <td style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 40px 40px 60px 40px; text-align: center;">
              <div style="display: inline-block; background: rgba(255,255,255,0.2); border-radius: 12px; padding: 12px 24px; margin-bottom: 20px;">
                <span style="color: #ffffff; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">
                  ${isConfirmation ? '✓ ' : '🔔 '}${timingLabel}${isConfirmation ? '' : ' Away'}
                </span>
              </div>
              <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 800; line-height: 1.2;">
                ${isConfirmation ? 'You\'re Registered!' : 'Event Reminder'}
              </h1>
            </td>
          </tr>

          <!-- Event Card -->
          <tr>
            <td style="padding: 0 40px; transform: translateY(-30px);">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border-radius: 16px; border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 8px 32px rgba(0,0,0,0.12);">
                <tr>
                  <td style="padding: 32px;">
                    <h2 style="margin: 0 0 8px 0; color: #ffffff; font-size: 28px; font-weight: 700; line-height: 1.3;">
                      ${eventTitle}
                    </h2>

                    ${eventDate ? `
                    <div style="margin: 20px 0 0 0; padding: 18px; background: rgba(255,255,255,0.12); border-radius: 12px; border-left: 4px solid #6366f1;">
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                        <tr>
                          <td style="padding: 4px 0;">
                            <span style="color: rgba(255,255,255,0.75); font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Date & Time</span>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 6px 0;">
                            <span style="color: #ffffff; font-size: 17px; font-weight: 600;">
                              📅 ${eventDate}${eventTime ? ` at ${eventTime}` : ''}
                            </span>
                          </td>
                        </tr>
                      </table>
                    </div>
                    ` : ''}

                    ${eventLocation ? `
                    <div style="margin: 12px 0 0 0; padding: 18px; background: rgba(255,255,255,0.12); border-radius: 12px; border-left: 4px solid #8b5cf6;">
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                        <tr>
                          <td style="padding: 4px 0;">
                            <span style="color: rgba(255,255,255,0.75); font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Location</span>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 6px 0;">
                            <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(eventLocation)}" style="color: #ffffff; font-size: 17px; font-weight: 600; text-decoration: none; display: inline-block;">
                              📍 ${eventLocation}
                              <span style="color: rgba(255,255,255,0.6); font-size: 14px; font-weight: 400; margin-left: 8px;">→ Open in Maps</span>
                            </a>
                          </td>
                        </tr>
                      </table>
                    </div>
                    ` : ''}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Message Content -->
          <tr>
            <td style="padding: 20px 40px 40px 40px;">
              <p style="margin: 0 0 24px 0; color: #1e293b; font-size: 16px; line-height: 1.6;">
                Hi ${guestName || 'there'} 👋
              </p>
              <p style="margin: 0 0 32px 0; color: #475569; font-size: 15px; line-height: 1.7;">
                ${message}
              </p>

              <!-- CTA Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="${eventUrl}" style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-size: 16px; font-weight: 700; box-shadow: 0 4px 16px rgba(99,102,241,0.3);">
                      View Event Details →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding: 0 40px;">
              <div style="height: 1px; background: linear-gradient(90deg, transparent 0%, #e2e8f0 50%, transparent 100%);"></div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 32px 40px; text-align: center;">
              <p style="margin: 0 0 12px 0; color: #94a3b8; font-size: 13px; line-height: 1.5;">
                Powered by <strong style="color: #6366f1;">LiteEvent</strong>
              </p>
              <p style="margin: 0; color: #cbd5e1; font-size: 12px; line-height: 1.5;">
                You're receiving this because you're registered for this event.<br>
                © ${new Date().getFullYear()} LiteEvent. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
        <!-- End Main Container -->

      </td>
    </tr>
  </table>
  <!-- End Wrapper -->

</body>
</html>
  `.trim();
}

// Plain text version for email clients that don't support HTML
export function generateReminderTextEmail({
  guestName,
  eventTitle,
  eventDate,
  eventTime,
  eventLocation,
  eventUrl,
  message,
  timing,
}) {
  return `
Hi ${guestName || 'there'},

${message}

EVENT DETAILS
━━━━━━━━━━━━━━━━━━━━━━
${eventTitle}

${eventDate ? `📅 Date: ${eventDate}${eventTime ? ` at ${eventTime}` : ''}` : ''}
${eventLocation ? `📍 Location: ${eventLocation}` : ''}

View full event details:
${eventUrl}

━━━━━━━━━━━━━━━━━━━━━━
Powered by LiteEvent
You're receiving this because you're registered for this event.

© ${new Date().getFullYear()} LiteEvent. All rights reserved.
  `.trim();
}
