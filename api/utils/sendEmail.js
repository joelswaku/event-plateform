//utils/sendEmail.js

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

// export async function sendPasswordChangedEmail({ to, name }) {

//   const html = `
//   <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111">

//     <h2>Password Changed Successfully</h2>

//     <p>Hello ${name || "there"},</p>

//     <p>Your password was successfully changed.</p>

//     <p>If you made this change, you can safely ignore this message.</p>

//     <p><b>If you did NOT change your password, please reset it immediately.</b></p>

//     <br/>

//     <p>For security, all active sessions were revoked.</p>

//     <br/>

//     <p>The Eventos Security Team</p>

//   </div>
//   `;

//   const info = await transporter.sendMail({
//     from: `"Eventos Security" <${env.mailFromEmail}>`,
//     to,
//     subject: "Your password was changed",
//     html,
//   });

//   console.log("Email sent:", info.messageId);
// }
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