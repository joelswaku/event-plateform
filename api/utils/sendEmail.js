//utils/sendEmail.js
import nodemailer from "nodemailer";
import { env } from "../config/env.js";
import { sendBrevoEmail } from "../services/brevo.service.js";

/* ── Nodemailer transporter (fallback when Brevo key not set) ─────── */
const nodemailerTransporter = nodemailer.createTransport({
  host: env.smtpHost,
  port: Number(env.smtpPort),
  secure: Number(env.smtpPort) === 465,
  auth: {
    user: env.smtpUser,
    pass: env.smtpPass,
  },
  tls: { rejectUnauthorized: false },
});

export async function sendResetPasswordEmail({ to, name, resetUrl }) {
  const html = `
  <!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"></head>
  <body style="margin:0;padding:0;background:#f5f4f0;font-family:Arial,sans-serif">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f4f0;padding:40px 16px">
      <tr><td align="center">
        <table width="100%" style="max-width:520px;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb" cellpadding="0" cellspacing="0">
          <tr><td style="background:#1C1917;padding:12px 32px;text-align:center">
            <p style="margin:0;font-size:11px;letter-spacing:0.3em;text-transform:uppercase;color:#C9A96E">LiteEvent Security</p>
          </td></tr>
          <tr><td style="padding:40px 36px">
            <h2 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#1C1917">Reset your password</h2>
            <p style="margin:0 0 24px;font-size:15px;color:#57534e;line-height:1.7">Hello <strong>${name}</strong>, we received a request to reset your password. Click the button below to set a new one.</p>
            <a href="${resetUrl}" style="display:inline-block;background:#1C1917;color:#C9A96E;text-decoration:none;font-size:13px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;padding:14px 32px;border:1px solid #C9A96E;border-radius:8px">Reset Password →</a>
            <p style="margin:24px 0 0;font-size:12px;color:#a8a29e;line-height:1.6">If you did not request this, you can safely ignore this email. This link expires in 1 hour.</p>
          </td></tr>
          <tr><td style="background:#faf9f6;padding:16px 36px;border-top:1px solid #f0ede8;text-align:center">
            <p style="margin:0;font-size:10px;color:#d6d3d1;letter-spacing:0.15em;text-transform:uppercase">Powered by LiteEvent</p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body></html>
  `;
  return sendMail({ to, name, subject: "Reset your LiteEvent password", html });
}

/* ── Vendor Welcome Email ─────────────────────────────────────────── */
export async function sendVendorWelcomeEmail({ to, name }) {
  const dashboardUrl = process.env.VENDOR_APP_URL || "http://localhost:3001/dashboard";
  const html = `
  <!DOCTYPE html><html lang="en">
  <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
  <body style="margin:0;padding:0;background:#0B0A0F;font-family:Arial,sans-serif">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#0B0A0F;padding:40px 16px">
      <tr><td align="center">
        <table width="100%" style="max-width:540px" cellpadding="0" cellspacing="0">

          <!-- Brand -->
          <tr><td style="text-align:center;padding-bottom:28px">
            <div style="display:inline-block;background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:10px 24px;border-radius:99px">
              <span style="color:#fff;font-size:13px;font-weight:900;letter-spacing:0.15em;text-transform:uppercase">⚡ LiteEvent Vendors</span>
            </div>
          </td></tr>

          <!-- Hero card -->
          <tr><td style="background:linear-gradient(135deg,#13122a,#1e1b4b);border-radius:20px;padding:44px 36px 36px;border:1px solid rgba(99,102,241,0.25)">

            <div style="text-align:center;margin-bottom:28px">
              <div style="font-size:44px;margin-bottom:14px">🎉</div>
              <h1 style="margin:0;font-size:26px;font-weight:800;color:#fff;letter-spacing:-0.03em;line-height:1.2">
                Welcome aboard,<br/>
                <span style="background:linear-gradient(135deg,#818cf8,#c084fc);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text">${name}!</span>
              </h1>
              <p style="margin:12px 0 0;font-size:14px;color:rgba(255,255,255,0.5);line-height:1.7">
                Your vendor profile is live on LiteEvent. Organizers worldwide can now discover and book you.
              </p>
            </div>

            <!-- Steps -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px">
              ${[
                ["1", "#4f46e5", "Complete your profile", "Add a bio, portfolio photos, and set your pricing to attract more bookings."],
                ["2", "#7c3aed", "Get verified", "Apply for a Verified badge to receive 3× more inquiries from organizers."],
                ["3", "#4ade80", "Respond fast", "Vendors who respond within 1 hour win 60% more bookings."],
              ].map(([num, color, title, desc]) => `
              <tr>
                <td style="padding:10px 0;vertical-align:top;width:40px">
                  <div style="width:28px;height:28px;background:${color}22;border:1px solid ${color}44;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;color:${color};text-align:center;line-height:28px">${num}</div>
                </td>
                <td style="padding:10px 0 10px 12px;vertical-align:top">
                  <p style="margin:0;font-size:14px;font-weight:700;color:#fff">${title}</p>
                  <p style="margin:3px 0 0;font-size:12px;color:rgba(255,255,255,0.4);line-height:1.6">${desc}</p>
                </td>
              </tr>`).join("")}
            </table>

            <!-- CTA -->
            <div style="text-align:center">
              <a href="${dashboardUrl}" style="display:inline-block;background:linear-gradient(135deg,#4f46e5,#7c3aed);color:#fff;text-decoration:none;font-size:14px;font-weight:800;padding:14px 36px;border-radius:12px;letter-spacing:0.02em">
                Go to My Dashboard →
              </a>
              <p style="margin:14px 0 0;font-size:11px;color:rgba(255,255,255,0.25)">
                Free plan · No credit card required
              </p>
            </div>
          </td></tr>

          <!-- Stats bar -->
          <tr><td style="padding:24px 0">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#111127;border-radius:14px;border:1px solid rgba(255,255,255,0.07)">
              <tr>
                ${[["527+","Active Vendors","#818cf8"],["18,400+","Bookings Done","#4ade80"],["98%","Satisfaction","#f59e0b"]].map(([val,label,color],i,arr) => `
                <td style="padding:18px 16px;text-align:center;${i < arr.length-1 ? 'border-right:1px solid rgba(255,255,255,0.06)' : ''}">
                  <div style="font-size:20px;font-weight:800;color:${color};letter-spacing:-0.02em">${val}</div>
                  <div style="font-size:10px;color:rgba(255,255,255,0.3);text-transform:uppercase;letter-spacing:0.08em;margin-top:3px">${label}</div>
                </td>`).join("")}
              </tr>
            </table>
          </td></tr>

          <!-- Footer -->
          <tr><td style="text-align:center;padding:8px 0 32px">
            <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.18);line-height:1.7">
              You're receiving this because you signed up at LiteEvent Vendors.<br/>
              Questions? Reply to this email — we read every message.
            </p>
          </td></tr>

        </table>
      </td></tr>
    </table>
  </body></html>`;
  return sendMail({ to, subject: `Welcome to LiteEvent Vendors, ${name}! 🎉`, html });
}

/* ── Organizer Welcome Email ──────────────────────────────────────── */
export async function sendOrganizerWelcomeEmail({ to, name }) {
  const browseUrl = process.env.VENDOR_APP_URL || "http://localhost:3001";
  const dashboardUrl = `${browseUrl}/organizer/dashboard`;
  const html = `
  <!DOCTYPE html><html lang="en">
  <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
  <body style="margin:0;padding:0;background:#0B0A0F;font-family:Arial,sans-serif">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#0B0A0F;padding:40px 16px">
      <tr><td align="center">
        <table width="100%" style="max-width:540px" cellpadding="0" cellspacing="0">

          <!-- Brand -->
          <tr><td style="text-align:center;padding-bottom:28px">
            <div style="display:inline-block;background:linear-gradient(135deg,#059669,#10b981);padding:10px 24px;border-radius:99px">
              <span style="color:#fff;font-size:13px;font-weight:900;letter-spacing:0.15em;text-transform:uppercase">✦ LiteEvent</span>
            </div>
          </td></tr>

          <!-- Hero card -->
          <tr><td style="background:linear-gradient(135deg,#021a14,#052e1c);border-radius:20px;padding:44px 36px 36px;border:1px solid rgba(16,185,129,0.25)">

            <div style="text-align:center;margin-bottom:28px">
              <div style="font-size:44px;margin-bottom:14px">🎊</div>
              <h1 style="margin:0;font-size:26px;font-weight:800;color:#fff;letter-spacing:-0.03em;line-height:1.2">
                You're in, ${name}!<br/>
                <span style="background:linear-gradient(135deg,#4ade80,#34d399);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text">Start discovering vendors.</span>
              </h1>
              <p style="margin:12px 0 0;font-size:14px;color:rgba(255,255,255,0.5);line-height:1.7">
                Your LiteEvent account is ready. Browse and contact 527+ verified event professionals instantly.
              </p>
            </div>

            <!-- What you can do -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px">
              ${[
                ["🔍", "Browse verified vendors", "Filter by category, location, price, and rating to find your perfect match."],
                ["💬", "Contact directly", "Send inquiries straight to vendors and get responses within hours."],
                ["❤️", "Save favourites", "Build a shortlist of vendors you love for your next event."],
              ].map(([icon, title, desc]) => `
              <tr>
                <td style="padding:10px 0;vertical-align:top;width:36px;font-size:22px">${icon}</td>
                <td style="padding:10px 0 10px 12px;vertical-align:top">
                  <p style="margin:0;font-size:14px;font-weight:700;color:#fff">${title}</p>
                  <p style="margin:3px 0 0;font-size:12px;color:rgba(255,255,255,0.4);line-height:1.6">${desc}</p>
                </td>
              </tr>`).join("")}
            </table>

            <!-- CTA -->
            <div style="text-align:center">
              <a href="${dashboardUrl}" style="display:inline-block;background:linear-gradient(135deg,#059669,#10b981);color:#fff;text-decoration:none;font-size:14px;font-weight:800;padding:14px 36px;border-radius:12px;letter-spacing:0.02em">
                Find My Vendors →
              </a>
              <p style="margin:14px 0 0;font-size:11px;color:rgba(255,255,255,0.25)">
                Free to use · No booking fees
              </p>
            </div>
          </td></tr>

          <!-- Category pills -->
          <tr><td style="padding:24px 0 0;text-align:center">
            <p style="margin:0 0 12px;font-size:11px;color:rgba(255,255,255,0.25);text-transform:uppercase;letter-spacing:0.08em">Browse categories</p>
            <div>
              ${["Photography","Music & DJ","Catering","Venues","Flowers & Décor","Lighting"].map(c =>
                `<span style="display:inline-block;margin:4px;padding:5px 12px;border-radius:100px;border:1px solid rgba(255,255,255,0.1);font-size:11px;color:rgba(255,255,255,0.5)">${c}</span>`
              ).join("")}
            </div>
          </td></tr>

          <!-- Footer -->
          <tr><td style="text-align:center;padding:28px 0 32px">
            <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.18);line-height:1.7">
              You're receiving this because you created an LiteEvent account.<br/>
              Questions? Reply to this email — we read every message.
            </p>
          </td></tr>

        </table>
      </td></tr>
    </table>
  </body></html>`;
  return sendMail({ to, subject: `Welcome to LiteEvent, ${name}! Find your perfect vendors ✦`, html });
}

export async function sendWelcomeEmail({ to, name }) {
  const html = `
  <!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"></head>
  <body style="margin:0;padding:0;background:#f5f4f0;font-family:Arial,sans-serif">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f4f0;padding:40px 16px">
      <tr><td align="center">
        <table width="100%" style="max-width:520px;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb" cellpadding="0" cellspacing="0">
          <tr><td style="background:#1C1917;padding:12px 32px;text-align:center">
            <p style="margin:0;font-size:11px;letter-spacing:0.3em;text-transform:uppercase;color:#C9A96E">🎉 Welcome to LiteEvent</p>
          </td></tr>
          <tr><td style="padding:40px 36px">
            <h2 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#1C1917">Hello ${name}!</h2>
            <p style="margin:0 0 16px;font-size:15px;color:#57534e;line-height:1.7">Your account was successfully created. You can now create events, invite guests, and manage everything from one beautiful dashboard.</p>
            <p style="margin:0 0 24px;font-size:15px;color:#57534e;line-height:1.7">Get started by creating your first event.</p>
            <p style="margin:0;font-size:14px;color:#78716c"><b>The LiteEvent Team</b></p>
          </td></tr>
          <tr><td style="background:#faf9f6;padding:16px 36px;border-top:1px solid #f0ede8;text-align:center">
            <p style="margin:0;font-size:10px;color:#d6d3d1;letter-spacing:0.15em;text-transform:uppercase">Powered by LiteEvent</p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body></html>
  `;
  return sendMail({ to, name, subject: "Welcome to LiteEvent 🎉", html });
}


/* ── Email Verification Code ─────────────────────────────────────── */
export async function sendVerificationCodeEmail({ to, name, code }) {
  const html = `
  <!DOCTYPE html><html lang="en">
  <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
  <body style="margin:0;padding:0;background:#0B0A0F;font-family:Arial,sans-serif">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#0B0A0F;padding:40px 16px">
      <tr><td align="center">
        <table width="100%" style="max-width:540px" cellpadding="0" cellspacing="0">

          <!-- Brand -->
          <tr><td style="text-align:center;padding-bottom:28px">
            <div style="display:inline-block;background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:10px 24px;border-radius:99px">
              <span style="color:#fff;font-size:13px;font-weight:900;letter-spacing:0.15em;text-transform:uppercase">⚡ LiteEvent</span>
            </div>
          </td></tr>

          <!-- Hero card -->
          <tr><td style="background:linear-gradient(135deg,#13122a,#1e1b4b);border-radius:20px;padding:44px 36px 36px;border:1px solid rgba(99,102,241,0.25)">

            <div style="text-align:center;margin-bottom:28px">
              <div style="font-size:44px;margin-bottom:14px">🔐</div>
              <h1 style="margin:0;font-size:26px;font-weight:800;color:#fff;letter-spacing:-0.03em;line-height:1.2">
                Verify your email
              </h1>
              <p style="margin:12px 0 0;font-size:14px;color:rgba(255,255,255,0.5);line-height:1.7">
                Hi <strong style="color:rgba(255,255,255,0.8);">${name}</strong>, enter this code to complete your registration.
              </p>
            </div>

            <!-- Verification Code Box -->
            <div style="background:rgba(99,102,241,0.1);border:2px solid rgba(99,102,241,0.3);border-radius:16px;padding:24px;text-align:center;margin-bottom:28px">
              <p style="margin:0 0 8px;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:rgba(255,255,255,0.4)">
                Your Verification Code
              </p>
              <p style="margin:0;font-size:42px;font-weight:900;letter-spacing:0.3em;color:#6366f1;font-family:'Courier New',monospace">
                ${code}
              </p>
              <p style="margin:12px 0 0;font-size:12px;color:rgba(255,255,255,0.35)">
                Code expires in <strong style="color:#818cf8">10 minutes</strong>
              </p>
            </div>

            <!-- Instructions -->
            <div style="text-align:center">
              <p style="margin:0 0 8px;font-size:13px;color:rgba(255,255,255,0.5);line-height:1.7">
                Enter this code in your app or browser to verify your email address.
              </p>
              <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.3);line-height:1.6">
                If you didn't create this account, you can safely ignore this email.
              </p>
            </div>
          </td></tr>

          <!-- Footer -->
          <tr><td style="text-align:center;padding:28px 0 32px">
            <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.18);line-height:1.7">
              This code was requested for ${to}<br/>
              Never share this code with anyone — not even LiteEvent support.
            </p>
          </td></tr>

        </table>
      </td></tr>
    </table>
  </body></html>`;
  return sendMail({ to, subject: `Your LiteEvent verification code: ${code}`, html });
}

/* ── New User Welcome Email (after verification) ──────────────────── */
export async function sendNewUserWelcomeEmail({ to, name }) {
  const dashboardUrl = process.env.FRONTEND_URL || "http://localhost:3000/dashboard";
  const html = `
  <!DOCTYPE html><html lang="en">
  <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
  <body style="margin:0;padding:0;background:#0B0A0F;font-family:Arial,sans-serif">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#0B0A0F;padding:40px 16px">
      <tr><td align="center">
        <table width="100%" style="max-width:540px" cellpadding="0" cellspacing="0">

          <!-- Brand -->
          <tr><td style="text-align:center;padding-bottom:28px">
            <div style="display:inline-block;background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:10px 24px;border-radius:99px">
              <span style="color:#fff;font-size:13px;font-weight:900;letter-spacing:0.15em;text-transform:uppercase">⚡ LiteEvent</span>
            </div>
          </td></tr>

          <!-- Hero card -->
          <tr><td style="background:linear-gradient(135deg,#13122a,#1e1b4b);border-radius:20px;padding:44px 36px 36px;border:1px solid rgba(99,102,241,0.25)">

            <div style="text-align:center;margin-bottom:28px">
              <div style="font-size:44px;margin-bottom:14px">🎉</div>
              <h1 style="margin:0;font-size:26px;font-weight:800;color:#fff;letter-spacing:-0.03em;line-height:1.2">
                Welcome to LiteEvent,<br/>
                <span style="background:linear-gradient(135deg,#818cf8,#c084fc);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text">${name}!</span>
              </h1>
              <p style="margin:12px 0 0;font-size:14px;color:rgba(255,255,255,0.5);line-height:1.7">
                Your email is verified and your account is ready. Let's create something amazing!
              </p>
            </div>

            <!-- What's Next -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px">
              ${[
                ["1", "#4f46e5", "Create your first event", "Set up an event in minutes with our beautiful templates."],
                ["2", "#7c3aed", "Customize & publish", "Add your branding, ticket types, and go live instantly."],
                ["3", "#4ade80", "Share & sell tickets", "Share your event page and start selling tickets right away."],
              ].map(([num, color, title, desc]) => `
              <tr>
                <td style="padding:10px 0;vertical-align:top;width:40px">
                  <div style="width:28px;height:28px;background:${color}22;border:1px solid ${color}44;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;color:${color};text-align:center;line-height:28px">${num}</div>
                </td>
                <td style="padding:10px 0 10px 12px;vertical-align:top">
                  <p style="margin:0;font-size:14px;font-weight:700;color:#fff">${title}</p>
                  <p style="margin:3px 0 0;font-size:12px;color:rgba(255,255,255,0.4);line-height:1.6">${desc}</p>
                </td>
              </tr>`).join("")}
            </table>

            <!-- CTA -->
            <div style="text-align:center">
              <a href="${dashboardUrl}" style="display:inline-block;background:linear-gradient(135deg,#4f46e5,#7c3aed);color:#fff;text-decoration:none;font-size:14px;font-weight:800;padding:14px 36px;border-radius:12px;letter-spacing:0.02em">
                Create My First Event →
              </a>
              <p style="margin:14px 0 0;font-size:11px;color:rgba(255,255,255,0.25)">
                All features included · No credit card required
              </p>
            </div>
          </td></tr>

          <!-- Quick Stats -->
          <tr><td style="padding:24px 0">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#111127;border-radius:14px;border:1px solid rgba(255,255,255,0.07)">
              <tr>
                ${[["12K+","Events Created","#818cf8"],["890K+","Tickets Sold","#4ade80"],["98%","Satisfaction","#f59e0b"]].map(([val,label,color],i,arr) => `
                <td style="padding:18px 16px;text-align:center;${i < arr.length-1 ? 'border-right:1px solid rgba(255,255,255,0.06)' : ''}">
                  <div style="font-size:20px;font-weight:800;color:${color};letter-spacing:-0.02em">${val}</div>
                  <div style="font-size:10px;color:rgba(255,255,255,0.3);text-transform:uppercase;letter-spacing:0.08em;margin-top:3px">${label}</div>
                </td>`).join("")}
              </tr>
            </table>
          </td></tr>

          <!-- Footer -->
          <tr><td style="text-align:center;padding:8px 0 32px">
            <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.18);line-height:1.7">
              Need help? Reply to this email — we read every message.<br/>
              Check out our <a href="${dashboardUrl}/help" style="color:#6366f1;text-decoration:none">Help Center</a> for guides and tips.
            </p>
          </td></tr>

        </table>
      </td></tr>
    </table>
  </body></html>`;
  return sendMail({ to, subject: `Welcome to LiteEvent, ${name}! 🎉`, html });
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

    <p>The LiteEvent Security Team</p>

  </div>
  `;

  return sendMail({
    to,
    subject: "Your password was changed",
    html
  });
}

/**
 * Core send function.
 * Priority: Resend → Brevo SMTP → Legacy Nodemailer.
 * Each provider falls through to the next on failure.
 */
export async function sendMail({ to, subject, html, name }) {
  /* 1. Resend — falls through to next provider on any error */
  if (env.resendApiKey) {
    try {
      const { Resend } = await import("resend");
      const resend = new Resend(env.resendApiKey);
      const from = `"${env.mailFromName || "LiteEvent"}" <${env.mailFromEmail}>`;
      const { data, error } = await resend.emails.send({ from, to, subject, html });
      if (error) {
        console.error(`[Resend] ❌ Failed sending to ${to}:`, error.message);
        if (error.message?.includes("testing emails to your own email")) {
          console.error(`[Resend] ⚠️  onboarding@resend.dev can only send to your Resend account email.`);
          console.error(`[Resend] ⚠️  Set MAIL_FROM_EMAIL to a verified domain, or test with your Resend account email.`);
        }
        // Fall through to next provider
      } else {
        console.log("[Resend] ✅ Email sent:", data.id, "→", to);
        return { messageId: data.id };
      }
    } catch (e) {
      console.error("[Resend] ❌ Exception:", e.message, "— trying next provider");
    }
  }

  /* 2. Brevo SMTP relay */
  if (env.brevoSmtpKey) {
    console.log("[Brevo] Sending via SMTP →", to);
    return sendBrevoEmail({ to, subject, html, name });
  }

  /* 3. Legacy Nodemailer fallback (Mailtrap / any SMTP) */
  const info = await nodemailerTransporter.sendMail({
    from: `"${env.mailFromName}" <${env.mailFromEmail}>`,
    to,
    subject,
    html,
  });
  console.log("[SMTP] Email sent:", info.messageId, "→", to);
  return { messageId: info.messageId };
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

  return sendMail({ to, name, subject: `Your seat for ${eventName}`, html });

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
    const qrUrl      = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(ticket.qr_token)}`;
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
                Powered by LiteEvent
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

/* ── Team invite: new user (no account) ─────────────────────────── */
export async function sendTeamInviteNewEmail({ to, inviteeName, inviterName, eventTitle, setupUrl }) {
  const html = `
  <!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"></head>
  <body style="margin:0;padding:0;background:#0a0a12;font-family:Arial,sans-serif">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a12;padding:40px 16px">
      <tr><td align="center">
        <table width="100%" style="max-width:520px;background:#111127;border-radius:16px;overflow:hidden;border:1px solid rgba(99,102,241,0.2)" cellpadding="0" cellspacing="0">
          <tr><td style="background:linear-gradient(135deg,#4f46e5,#6366f1);padding:32px;text-align:center">
            <p style="margin:0;font-size:32px">👥</p>
            <h1 style="margin:12px 0 0;font-size:22px;font-weight:900;color:#fff;letter-spacing:-0.5px">You've been invited!</h1>
          </td></tr>
          <tr><td style="padding:32px 36px">
            <p style="margin:0 0 4px;font-size:15px;color:rgba(255,255,255,0.7);line-height:1.7">
              Hi <strong style="color:#fff">${inviteeName || "there"}</strong>,
            </p>
            <p style="margin:0 0 12px;font-size:15px;color:rgba(255,255,255,0.7);line-height:1.7">
              <strong style="color:#fff">${inviterName}</strong> has invited you to help manage
              <strong style="color:#a78bfa">${eventTitle}</strong>.
            </p>
            <p style="margin:0 0 24px;font-size:14px;color:rgba(255,255,255,0.5);line-height:1.7">
              Click the button below to create your account and start managing this event. The link is valid for 7 days.
            </p>
            <a href="${setupUrl}" style="display:inline-block;background:linear-gradient(135deg,#4f46e5,#6366f1);color:#fff;text-decoration:none;font-size:14px;font-weight:800;padding:14px 32px;border-radius:12px;letter-spacing:0.02em">
              Create account &amp; join event →
            </a>
            <p style="margin:20px 0 0;font-size:12px;color:rgba(255,255,255,0.25);line-height:1.6">
              Or copy this link: ${setupUrl}<br/>
              If you didn't expect this, you can safely ignore it.
            </p>
          </td></tr>
          <tr><td style="background:rgba(255,255,255,0.03);padding:16px 36px;border-top:1px solid rgba(255,255,255,0.06);text-align:center">
            <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.2);letter-spacing:0.1em;text-transform:uppercase">Powered by LiteEvent</p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body></html>`;
  return sendMail({ to, subject: `You've been invited to manage "${eventTitle}"`, html });
}

/* ── Team invite: existing user (has account) ───────────────────── */
export async function sendTeamInviteExistingEmail({ to, inviteeName, inviterName, eventTitle, loginUrl }) {
  const html = `
  <!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"></head>
  <body style="margin:0;padding:0;background:#0a0a12;font-family:Arial,sans-serif">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a12;padding:40px 16px">
      <tr><td align="center">
        <table width="100%" style="max-width:520px;background:#111127;border-radius:16px;overflow:hidden;border:1px solid rgba(16,185,129,0.2)" cellpadding="0" cellspacing="0">
          <tr><td style="background:linear-gradient(135deg,#059669,#10b981);padding:32px;text-align:center">
            <p style="margin:0;font-size:32px">🎉</p>
            <h1 style="margin:12px 0 0;font-size:22px;font-weight:900;color:#fff;letter-spacing:-0.5px">You're on the team!</h1>
          </td></tr>
          <tr><td style="padding:32px 36px">
            <p style="margin:0 0 8px;font-size:15px;color:rgba(255,255,255,0.7);line-height:1.7">
              Hi <strong style="color:#fff">${inviteeName}</strong>,
            </p>
            <p style="margin:0 0 24px;font-size:15px;color:rgba(255,255,255,0.7);line-height:1.7">
              <strong style="color:#fff">${inviterName}</strong> has added you to manage
              <strong style="color:#6ee7b7">${eventTitle}</strong>.
            </p>

            <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px">
              <tr><td style="background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.2);border-radius:10px;padding:14px 18px">
                <p style="margin:0;font-size:13px;color:#6ee7b7;font-weight:700">You already have an LiteEvent account</p>
                <p style="margin:4px 0 0;font-size:12px;color:rgba(255,255,255,0.45)">Sign in and the event will appear in your dashboard automatically.</p>
              </td></tr>
            </table>

            <a href="${loginUrl}" style="display:inline-block;background:linear-gradient(135deg,#059669,#10b981);color:#fff;text-decoration:none;font-size:14px;font-weight:800;padding:14px 32px;border-radius:12px;letter-spacing:0.02em">
              Sign in to dashboard →
            </a>
            <p style="margin:20px 0 0;font-size:12px;color:rgba(255,255,255,0.25);line-height:1.6">
              Or go to: ${loginUrl}
            </p>
          </td></tr>
          <tr><td style="background:rgba(255,255,255,0.03);padding:16px 36px;border-top:1px solid rgba(255,255,255,0.06);text-align:center">
            <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.2);letter-spacing:0.1em;text-transform:uppercase">Powered by LiteEvent</p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body></html>`;
  return sendMail({ to, subject: `You've been added to manage "${eventTitle}"`, html });
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

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=10&color=1C1917&bgcolor=FFFDF9&data=${encodeURIComponent(qrToken)}`;

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
              <img src="${qrImageUrl}" alt="Entry QR Code" width="200" height="200" style="display:block;border-radius:4px" />
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
              Powered by LiteEvent
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