//utils/sendEmail.js
import nodemailer from "nodemailer";
import QRCode from "qrcode";
import { env } from "../config/env.js";

const transporter = nodemailer.createTransport({
  host: env.smtpHost,
  port: Number(env.smtpPort),
  secure: Number(env.smtpPort) === 465,
  auth: {
    user: env.smtpUser,
    pass: env.smtpPass,
  },
  tls: {
    // Required for Mailtrap sandbox and self-signed certs in dev
    rejectUnauthorized: false,
  },
});

export async function sendResetPasswordEmail({ to, name, resetUrl }) {

  const html = `
    <h2>Reset your password</h2>
    <p>Hello ${name}</p>
    <p><a href="${resetUrl}">Reset Password</a></p>
  `;

  const info = await transporter.sendMail({
    from: `"${env.mailFromName}" <${env.mailFromEmail}>`,
    to,
    subject: "Reset password",
    html,
  });

  console.log("Email sent:", info.messageId);
  console.log("Accepted:", info.accepted);
  console.log("Rejected:", info.rejected);
}

export async function sendWelcomeEmail({ to, name }) {

  const html = `
  <h2>Welcome to Eventos 🎉</h2>
  <p>Hello ${name},</p>

  <p>Your account was successfully created.</p>

  <p>You can now create events, invite guests, and manage everything in one dashboard.</p>

  <p>Start creating your first event.</p>

  <br/>

  <b>The Eventos Team</b>
  `;

  const info = await transporter.sendMail({
    from: `"${env.mailFromName}" <${env.mailFromEmail}>`,
    to,
    subject: "Welcome to Eventos",
    html,
  });

  console.log("Email sent:", info.messageId);
  console.log("Accepted:", info.accepted);
  console.log("Rejected:", info.rejected);
}


export async function sendPasswordChangedEmail({ to, name }) {

  const html = `
  <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111">

    <h2>Password Changed Successfully</h2>

    <p>Hello ${name || "there"},</p>

    <p>Your password was successfully changed.</p>

    <p>If you made this change, you can safely ignore this message.</p>

    <p><b>If you did NOT change your password, please reset it immediately.</b></p>

    <br/>

    <p>For security, all active sessions were revoked.</p>

    <br/>

    <p>The Eventos Security Team</p>

  </div>
  `;

  return sendMail({
    to,
    subject: "Your password was changed",
    html
  });
}

export async function sendMail({ to, subject, html }) {

  const info = await transporter.sendMail({
    from: `"${env.mailFromName}" <${env.mailFromEmail}>`,
    to,
    subject,
    html,
  });

  console.log("Email sent:", info.messageId);
  console.log("Accepted:", info.accepted);
  console.log("Rejected:", info.rejected);

  return info;
}
export async function sendSeatAssignmentEmail({
  to,
  name,
  eventName,
  tableName,
  seatNumber
}) {

  const html = `
  <h2>Your Seat for ${eventName}</h2>

  <p>Hello ${name},</p>

  <p>We are excited to confirm your seating.</p>

  <b>Location:</b> ${tableName}<br/>
  <b>Seat:</b> ${seatNumber ?? "General Seating"}

  <br/><br/>

  <p>Please keep your QR code for check-in.</p>

  <p>See you soon!</p>
  `;

  await transporter.sendMail({
    from: `"Eventos" <${env.mailFromEmail}>`,
    to,
    subject: `Your seat for ${eventName}`,
    html
  });

}

// Replace the sendTicketIssuedEmail function in api/utils/sendEmail.js
// Keep everything else in the file unchanged

export async function sendTicketIssuedEmail({ to, buyerName, eventName, tickets }) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.FRONTEND_URL || "http://localhost:3000";

  // Tier colors by ticket name
  function getTierStyle(ticketTypeName) {
    const n = (ticketTypeName || "").toLowerCase();
    if (n.includes("vip") || n.includes("platinum") || n.includes("premium"))
      return { accent: "#C9A96E", bg: "#1a1200", badge: "VIP", icon: "👑" };
    if (n.includes("pro") || n.includes("diamond") || n.includes("all-access"))
      return { accent: "#a78bfa", bg: "#0d0718", badge: "PRO", icon: "💎" };
    if (n.includes("early") || n.includes("bird"))
      return { accent: "#f59e0b", bg: "#1c1002", badge: "EARLY BIRD", icon: "⚡" };
    if (n.includes("free") || n.includes("general"))
      return { accent: "#10b981", bg: "#022c22", badge: "FREE", icon: "🎁" };
    return { accent: "#6366f1", bg: "#0f0f1f", badge: "STANDARD", icon: "🎟️" };
  }

  const ticketBlocks = tickets.map((ticket, idx) => {
    const tier       = getTierStyle(ticket.ticket_type_name);
    const ticketNum  = ticket.ticket_number || `TKT-${String(ticket.id).slice(0, 8).toUpperCase()}`;
    const qrUrl      = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/public/tickets/qr/${ticket.qr_token}`;
    const portalUrl  = `${baseUrl}/my-tickets?email=${encodeURIComponent(to)}&ticket_number=${encodeURIComponent(ticketNum)}`;

    return `
    <!-- TICKET CARD ${idx + 1} -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;border-radius:16px;overflow:hidden;border:1px solid ${tier.accent}40;">
      
      <!-- Tier header bar -->
      <tr>
        <td style="background:${tier.bg};padding:0;height:4px;background:linear-gradient(90deg,${tier.accent},${tier.accent}40,transparent);">
          <div style="height:4px;"></div>
        </td>
      </tr>

      <!-- Ticket header -->
      <tr>
        <td style="background:${tier.bg};padding:24px 28px 16px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td>
                <span style="display:inline-block;background:${tier.accent}20;border:1px solid ${tier.accent}40;color:${tier.accent};font-size:10px;font-weight:900;letter-spacing:0.2em;text-transform:uppercase;padding:3px 10px;border-radius:99px;">
                  ${tier.icon} ${tier.badge}
                </span>
                <h3 style="margin:10px 0 4px;font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-0.02em;font-family:Arial,sans-serif;">
                  ${ticket.ticket_type_name}
                </h3>
                <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.45);font-family:Arial,sans-serif;">
                  ${eventName}
                </p>
              </td>
              <td style="text-align:right;vertical-align:top;">
                <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.35);font-family:Arial,sans-serif;letter-spacing:0.08em;text-transform:uppercase;">Ticket No.</p>
                <p style="margin:4px 0 0;font-size:16px;font-weight:900;color:${tier.accent};font-family:'Courier New',monospace;letter-spacing:0.1em;">
                  ${ticketNum}
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- Perforation line -->
      <tr>
        <td style="background:${tier.bg};padding:0 28px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="height:1px;background:${tier.accent}20;"></td>
              <td style="width:8px;height:8px;background:${tier.accent}15;border-radius:50%;"></td>
              <td style="width:8px;height:8px;background:${tier.accent}15;border-radius:50%;"></td>
              <td style="width:8px;height:8px;background:${tier.accent}15;border-radius:50%;"></td>
              <td style="width:8px;height:8px;background:${tier.accent}15;border-radius:50%;"></td>
              <td style="width:8px;height:8px;background:${tier.accent}15;border-radius:50%;"></td>
              <td style="height:1px;background:${tier.accent}20;"></td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- Holder info + QR -->
      <tr>
        <td style="background:${tier.bg};padding:20px 28px 24px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <!-- Left: details -->
              <td style="vertical-align:top;">
                <table cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding-bottom:12px;">
                      <p style="margin:0;font-size:10px;color:rgba(255,255,255,0.35);font-family:Arial,sans-serif;letter-spacing:0.1em;text-transform:uppercase;">Ticket Holder</p>
                      <p style="margin:3px 0 0;font-size:15px;font-weight:700;color:#ffffff;font-family:Arial,sans-serif;">
                        ${ticket.holder_name || buyerName || "Guest"}
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding-bottom:12px;">
                      <p style="margin:0;font-size:10px;color:rgba(255,255,255,0.35);font-family:Arial,sans-serif;letter-spacing:0.1em;text-transform:uppercase;">Status</p>
                      <p style="margin:3px 0 0;font-size:13px;font-weight:700;color:#10b981;font-family:Arial,sans-serif;">
                        ✓ Confirmed &amp; Active
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <a href="${portalUrl}"
                        style="display:inline-block;background:${tier.accent};color:${tier.bg};font-size:12px;font-weight:800;padding:10px 20px;border-radius:8px;text-decoration:none;letter-spacing:0.05em;">
                        View My Ticket →
                      </a>
                    </td>
                  </tr>
                </table>
              </td>
              <!-- Right: QR -->
              <td style="text-align:right;vertical-align:top;">
                <div style="display:inline-block;background:#ffffff;padding:8px;border-radius:12px;">
                  <img src="${qrUrl}" width="100" height="100" alt="Ticket QR" style="display:block;border-radius:6px;" />
                </div>
                <p style="margin:6px 0 0;font-size:10px;color:rgba(255,255,255,0.3);font-family:Arial,sans-serif;text-align:center;">Scan at entry</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>

    </table>
    `;
  }).join("");

  const html = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>Your Tickets — ${eventName}</title>
  </head>
  <body style="margin:0;padding:0;background:#0a0a0f;font-family:Arial,sans-serif;">

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0f;padding:40px 16px;">
      <tr><td align="center">
        <table width="100%" style="max-width:580px;" cellpadding="0" cellspacing="0">

          <!-- LOGO / BRAND -->
          <tr>
            <td style="text-align:center;padding-bottom:32px;">
              <div style="display:inline-block;background:linear-gradient(135deg,#6366f1,#a78bfa);padding:12px 24px;border-radius:99px;">
                <span style="color:#fff;font-size:14px;font-weight:900;letter-spacing:0.15em;text-transform:uppercase;">🎟 EventOS</span>
              </div>
            </td>
          </tr>

          <!-- HERO -->
          <tr>
            <td style="background:linear-gradient(135deg,#111827,#1e1b4b);border-radius:20px;padding:40px 32px;text-align:center;margin-bottom:24px;border:1px solid rgba(99,102,241,0.2);">
              <div style="font-size:48px;margin-bottom:16px;">🎉</div>
              <h1 style="margin:0;font-size:28px;font-weight:900;color:#ffffff;letter-spacing:-0.03em;">
                You&apos;re going to<br/>
                <span style="background:linear-gradient(135deg,#6366f1,#a78bfa);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;">
                  ${eventName}
                </span>
              </h1>
              <p style="margin:12px 0 0;font-size:14px;color:rgba(255,255,255,0.5);">
                Hi <strong style="color:rgba(255,255,255,0.8);">${buyerName || "there"}</strong> — your ${tickets.length === 1 ? "ticket is" : `${tickets.length} tickets are`} confirmed below.
              </p>
            </td>
          </tr>

          <tr><td style="height:24px;"></td></tr>

          <!-- TICKETS -->
          <tr>
            <td>
              ${ticketBlocks}
            </td>
          </tr>

          <!-- HOW TO USE -->
          <tr>
            <td style="background:#111827;border-radius:16px;padding:24px 28px;border:1px solid rgba(255,255,255,0.06);">
              <p style="margin:0 0 16px;font-size:11px;font-weight:900;letter-spacing:0.15em;text-transform:uppercase;color:rgba(255,255,255,0.3);">
                How to use your ticket
              </p>
              <table width="100%" cellpadding="0" cellspacing="0">
                ${[
                  ["📲", "Show QR at entry", "Present your QR code at the door for instant check-in"],
                  ["🔑", "Access your profile", `Visit <a href="${baseUrl}/my-tickets" style="color:#6366f1;">my-tickets</a> with your email + ticket number`],
                  ["📧", "Keep this email", "Your ticket number and QR code are always in this email"],
                ].map(([icon, title, desc]) => `
                <tr>
                  <td style="padding:8px 0;vertical-align:top;width:36px;">
                    <span style="font-size:20px;">${icon}</span>
                  </td>
                  <td style="padding:8px 0 8px 8px;vertical-align:top;">
                    <p style="margin:0;font-size:13px;font-weight:700;color:#ffffff;">${title}</p>
                    <p style="margin:2px 0 0;font-size:12px;color:rgba(255,255,255,0.4);">${desc}</p>
                  </td>
                </tr>
                `).join("")}
              </table>
            </td>
          </tr>

          <!-- PORTAL CTA -->
          <tr>
            <td style="text-align:center;padding:32px 0 16px;">
              <a href="${baseUrl}/my-tickets?email=${encodeURIComponent(to)}"
                style="display:inline-block;background:linear-gradient(135deg,#6366f1,#a78bfa);color:#ffffff;font-size:14px;font-weight:800;padding:14px 32px;border-radius:12px;text-decoration:none;letter-spacing:0.03em;">
                View All My Tickets
              </a>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="text-align:center;padding:16px 0 40px;">
              <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.2);">
                This ticket was issued by EventOS · Questions? Reply to this email<br/>
                Your ticket is non-transferable and linked to your email address.
              </p>
            </td>
          </tr>

        </table>
      </td></tr>
    </table>

  </body>
  </html>
  `;

  return sendMail({
    to,
    subject: `🎟 Your ${tickets.length === 1 ? "ticket" : "tickets"} for ${eventName}`,
    html,
  });
}



export async function sendEventInvitationEmail({
  to,
  guest,
  event,
  invitationUrl,
  eventPageUrl,
}) {
  const ctaUrl  = eventPageUrl || invitationUrl;
  const dateStr = (() => {
    const d = event.starts_at || event.start_at;
    if (!d) return null;
    return new Date(d).toLocaleDateString("en-US", {
      weekday: "long", month: "long", day: "numeric", year: "numeric",
    });
  })();
  const venue = event.venue_name || event.location_name || null;

  const html = `
  <!DOCTYPE html>
  <html lang="en">
  <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
  <body style="margin:0;padding:0;background:#f5f4f0;font-family:’Georgia’,serif">

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f4f0;padding:40px 16px">
      <tr><td align="center">
        <table width="100%" style="max-width:560px;background:#ffffff;border-radius:4px;overflow:hidden" cellpadding="0" cellspacing="0">

          <!-- HEADER BAR -->
          <tr>
            <td style="background:#1C1917;padding:10px 32px">
              <p style="margin:0;font-size:11px;letter-spacing:0.3em;text-transform:uppercase;color:#C9A96E;text-align:center">
                Private Invitation
              </p>
            </td>
          </tr>

          <!-- HERO -->
          <tr>
            <td style="padding:52px 40px 40px;text-align:center;border-bottom:1px solid #f0ede8">
              <p style="margin:0 0 16px;font-size:11px;letter-spacing:0.3em;text-transform:uppercase;color:#C9A96E">
                You are cordially invited to
              </p>
              <h1 style="margin:0;font-size:36px;font-weight:700;font-style:italic;color:#1C1917;line-height:1.2">
                ${event.title}
              </h1>
              ${dateStr || venue ? `
              <div style="margin-top:24px;display:inline-block;text-align:center">
                ${dateStr ? `<p style="margin:4px 0;font-size:14px;color:#78716c">${dateStr}</p>` : ""}
                ${venue  ? `<p style="margin:4px 0;font-size:14px;color:#78716c">${venue}</p>` : ""}
              </div>` : ""}
            </td>
          </tr>

          <!-- GREETING -->
          <tr>
            <td style="padding:36px 40px 0">
              <p style="margin:0;font-size:16px;color:#44403c;line-height:1.7">
                Dear <strong>${guest.full_name}</strong>,
              </p>
              <p style="margin:16px 0 0;font-size:15px;color:#78716c;line-height:1.8">
                We are delighted to extend this personal invitation to you.
                Your presence would mean a great deal to us.
              </p>
              <p style="margin:12px 0 0;font-size:15px;color:#78716c;line-height:1.8">
                Please let us know whether you will be able to join us by confirming
                your attendance using the link below.
              </p>
            </td>
          </tr>

          <!-- DIVIDER -->
          <tr>
            <td style="padding:36px 40px">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="border-top:1px solid #e7e5e4"></td>
                  <td style="padding:0 12px;white-space:nowrap">
                    <div style="width:6px;height:6px;background:#C9A96E;transform:rotate(45deg);display:inline-block"></div>
                  </td>
                  <td style="border-top:1px solid #e7e5e4"></td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding:0 40px 48px;text-align:center">
              <a href="${ctaUrl}"
                style="display:inline-block;background:#1C1917;color:#C9A96E;text-decoration:none;font-size:12px;font-weight:600;letter-spacing:0.25em;text-transform:uppercase;padding:16px 40px;border:1px solid #C9A96E">
                View Invitation &amp; Confirm Attendance
              </a>
              <p style="margin:20px 0 0;font-size:11px;color:#a8a29e;line-height:1.6">
                This invitation is personal and intended solely for
                <strong style="color:#78716c">${guest.full_name}</strong>.
              </p>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background:#faf9f6;padding:20px 40px;border-top:1px solid #f0ede8;text-align:center">
              <p style="margin:0;font-size:11px;color:#c4bfba;letter-spacing:0.1em">
                If the button above does not work, copy this link into your browser:<br>
                <a href="${ctaUrl}" style="color:#C9A96E;word-break:break-all;text-decoration:none">${ctaUrl}</a>
              </p>
              <p style="margin:12px 0 0;font-size:10px;color:#d6d3d1;letter-spacing:0.15em;text-transform:uppercase">
                Powered by Eventos
              </p>
            </td>
          </tr>

        </table>
      </td></tr>
    </table>

  </body>
  </html>
  `;

  return await sendMail({
    to,
    subject: `Your invitation to ${event.title}`,
    html,
  });
}

export async function sendRsvpConfirmationEmail({
  to,
  guestName,
  eventTitle,
  eventDate,
  venueName,
  qrToken,
  plusOneCount = 0,
}) {
  const dateStr = eventDate
    ? new Date(eventDate).toLocaleDateString("en-US", {
        weekday: "long", month: "long", day: "numeric", year: "numeric",
      })
    : null;

  // Generate QR code as a base64 PNG data URL
  const qrDataUrl = await QRCode.toDataURL(qrToken, {
    width: 240,
    margin: 2,
    color: { dark: "#1C1917", light: "#FFFDF9" },
  });

  const html = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f4f0;font-family:'Georgia',serif">

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f4f0;padding:40px 16px">
    <tr><td align="center">
      <table width="100%" style="max-width:560px;background:#ffffff;border-radius:4px;overflow:hidden" cellpadding="0" cellspacing="0">

        <!-- HEADER BAR -->
        <tr>
          <td style="background:#1C1917;padding:10px 32px">
            <p style="margin:0;font-size:11px;letter-spacing:0.3em;text-transform:uppercase;color:#C9A96E;text-align:center">
              RSVP Confirmed
            </p>
          </td>
        </tr>

        <!-- HERO -->
        <tr>
          <td style="padding:52px 40px 36px;text-align:center;border-bottom:1px solid #f0ede8">
            <p style="margin:0 0 8px;font-size:32px">🎊</p>
            <p style="margin:0 0 16px;font-size:11px;letter-spacing:0.3em;text-transform:uppercase;color:#C9A96E">
              We&apos;ll see you there!
            </p>
            <h1 style="margin:0;font-size:30px;font-weight:700;font-style:italic;color:#1C1917;line-height:1.2">
              ${eventTitle}
            </h1>
            ${dateStr ? `<p style="margin:12px 0 0;font-size:14px;color:#78716c">${dateStr}</p>` : ""}
            ${venueName ? `<p style="margin:4px 0 0;font-size:14px;color:#78716c">📍 ${venueName}</p>` : ""}
          </td>
        </tr>

        <!-- GREETING -->
        <tr>
          <td style="padding:32px 40px 0">
            <p style="margin:0;font-size:15px;color:#44403c;line-height:1.7">
              Dear <strong>${guestName}</strong>,
            </p>
            <p style="margin:12px 0 0;font-size:14px;color:#78716c;line-height:1.8">
              Your attendance has been confirmed. We are so excited to celebrate with you!
            </p>
            ${plusOneCount > 0 ? `
            <p style="margin:12px 0 0;font-size:14px;color:#78716c;line-height:1.8">
              You will be joining us with <strong style="color:#1C1917">${plusOneCount} companion${plusOneCount > 1 ? "s" : ""}</strong>.
            </p>` : ""}
          </td>
        </tr>

        <!-- DIVIDER -->
        <tr>
          <td style="padding:32px 40px">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="border-top:1px solid #e7e5e4"></td>
                <td style="padding:0 12px;white-space:nowrap">
                  <div style="width:6px;height:6px;background:#C9A96E;transform:rotate(45deg);display:inline-block"></div>
                </td>
                <td style="border-top:1px solid #e7e5e4"></td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- QR CODE -->
        <tr>
          <td style="padding:0 40px 48px;text-align:center">
            <p style="margin:0 0 6px;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#9a8c7e">
              Your Entry Pass
            </p>
            <p style="margin:0 0 24px;font-size:13px;color:#78716c;line-height:1.6">
              Present this QR code at the entrance for check-in.
            </p>
            <div style="display:inline-block;padding:16px;border:1px solid #e8d9c0;border-radius:12px;background:#fffdf9">
              <img src="${qrDataUrl}" alt="Entry QR Code" width="200" height="200" style="display:block;border-radius:4px" />
            </div>
            <p style="margin:16px 0 0;font-size:11px;color:#c4bfba;line-height:1.6;word-break:break-all">
              Token: ${qrToken}
            </p>
          </td>
        </tr>

        <!-- FOOTER -->
        <tr>
          <td style="background:#faf9f6;padding:20px 40px;border-top:1px solid #f0ede8;text-align:center">
            <p style="margin:0;font-size:11px;color:#c4bfba;line-height:1.7">
              Please keep this email as your entry pass. Do not share it with others.
            </p>
            <p style="margin:12px 0 0;font-size:10px;color:#d6d3d1;letter-spacing:0.15em;text-transform:uppercase">
              Powered by Eventos
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>

</body>
</html>
  `;

  return sendMail({
    to,
    subject: `Your entry pass for ${eventTitle}`,
    html,
  });
}