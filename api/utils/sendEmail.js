//utils/sendEmail.js
import QRCode from "qrcode";
import nodemailer from "nodemailer";
import { env } from "../config/env.js";

const transporter = nodemailer.createTransport({
  host: env.smtpHost,
  port: Number(env.smtpPort),
  secure: Number(env.smtpPort) === 465,
  auth: {
    user: env.smtpUser,
    pass: env.smtpPass,
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
}) {
  // ✅ Generate QR Code (base64)
  const qrCodeBase64 = await QRCode.toDataURL(invitationUrl);

  // ✅ Google Calendar link
  const googleCalendarUrl = `https://www.google.com/calendar/render?action=TEMPLATE
&text=${encodeURIComponent(event.title)}
&dates=${event.start_at}/${event.end_at}
&details=${encodeURIComponent("You're invited!")}
&location=${encodeURIComponent(event.location_name || "")}`.replace(/\n/g, "");

  const html = `
  <div style="font-family:Arial;background:#f4f4f7;padding:20px">

    <div style="max-width:600px;margin:auto;background:#fff;border-radius:12px;overflow:hidden">

      <!-- HERO -->
      <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;padding:40px;text-align:center">
        <h1>You're Invited 🎉</h1>
        <p>${event.title}</p>
      </div>

      <!-- BODY -->
      <div style="padding:30px">

        <p>Hello <b>${guest.full_name}</b>,</p>

        <p>You are invited to <strong>${event.title}</strong>.</p>

        <!-- EVENT INFO -->
        <div style="background:#f9fafb;padding:15px;border-radius:8px;margin:20px 0">
          <p><b>📅 Date:</b> ${event.start_at || "TBA"}</p>
          <p><b>📍 Location:</b> ${event.location_name || "TBA"}</p>
        </div>

        <!-- COUNTDOWN (fallback text) -->
        <p style="text-align:center;font-size:14px;color:#666;">
          ⏳ Happening soon — don’t miss it!
        </p>

        <!-- CTA -->
        <div style="text-align:center;margin:25px 0">
          <a href="${invitationUrl}"
            style="background:#6366f1;color:#fff;padding:14px 24px;border-radius:8px;text-decoration:none;font-weight:bold">
            View Invitation & RSVP
          </a>
        </div>

        <!-- QR CODE -->
        <div style="text-align:center;margin:20px 0">
          <p style="font-size:14px;color:#666;">Scan for quick access:</p>
          <img src="${qrCodeBase64}" width="140" />
        </div>

        <!-- ADD TO CALENDAR -->
        <div style="text-align:center;margin:20px 0">
          <a href="${googleCalendarUrl}" target="_blank"
            style="display:inline-block;padding:10px 18px;border:1px solid #ddd;border-radius:6px;text-decoration:none;color:#333;font-size:14px">
            📅 Add to Google Calendar
          </a>
        </div>

        <!-- FALLBACK LINK -->
        <p style="font-size:12px;color:#888">
          Or open manually:
        </p>

        <p style="font-size:12px;color:#6366f1;word-break:break-all;">
          ${invitationUrl}
        </p>

      </div>

      <!-- FOOTER -->
      <div style="background:#f9fafb;padding:15px;text-align:center;font-size:12px;color:#999">
        Powered by Eventos
      </div>

    </div>
  </div>
  `;

  await sendMail({
    to,
    subject: `You're invited to ${event.title} 🎉`,
    html,
  });
}