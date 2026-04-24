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

export async function sendTicketIssuedEmail({
  to,
  buyerName,
  eventName,
  tickets,
}) {
  const ticketHtml = tickets
    .map(
      (ticket, index) => `
        <div style="padding:12px;border:1px solid #ddd;margin-bottom:12px;border-radius:8px;">
          <p><strong>Ticket ${index + 1}</strong></p>
          <p><strong>Holder:</strong> ${ticket.holder_name || buyerName || "Guest"}</p>
          <p><strong>Ticket Type:</strong> ${ticket.ticket_type_name}</p>
          <p><strong>QR Token:</strong> ${ticket.qr_token}</p>
        </div>
      `
    )
    .join("");

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111">
      <h2>Your tickets for ${eventName}</h2>
      <p>Hello ${buyerName || "there"},</p>
      <p>Your order has been confirmed. Your tickets are ready.</p>
      ${ticketHtml}
      <p>Please present your ticket QR at the entrance.</p>
      <p>Thank you.</p>
    </div>
  `;

  return sendMail({
    to,
    subject: `Your tickets for ${eventName}`,
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