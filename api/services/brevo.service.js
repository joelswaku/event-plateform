// /**
//  * api/services/brevo.service.js
//  *
//  * Brevo (formerly Sendinblue) integration.
//  *
//  * EMAIL  → Brevo SMTP relay via Nodemailer (uses xsmtpsib- key)
//  * SMS    → Brevo REST API via BrevoClient (uses xkeysib- API key)
//  * WhatsApp → Brevo REST API via BrevoClient (uses xkeysib- API key)
//  *
//  * Required env vars:
//  *   BREVO_SMTP_LOGIN  – your Brevo account login email
//  *   BREVO_SMTP_KEY    – your Brevo SMTP key  (xsmtpsib-...)
//  *   BREVO_API_KEY     – your Brevo REST API key (xkeysib-...) for SMS/WhatsApp
//  *   MAIL_FROM_EMAIL   – verified sender email address
//  *   MAIL_FROM_NAME    – display name (default: "LiteEvent")
//  *   BREVO_SMS_SENDER  – SMS sender name, max 11 chars (default: "LiteEvent")
//  */

// import nodemailer                from "nodemailer";
// import { BrevoClient }           from "@getbrevo/brevo";
// import { env }                   from "../config/env.js";

// /* ── Email: Brevo SMTP relay ─────────────────────────────────────── */

// let _smtpTransporter = null;

// function getSmtpTransporter() {
//   const login = env.brevoSmtpLogin;
//   const key   = env.brevoSmtpKey;

//   if (!login || !key) return null;

//   if (!_smtpTransporter) {
//     _smtpTransporter = nodemailer.createTransport({
//       host:   "smtp-relay.brevo.com",
//       port:   587,
//       secure: false,
//       auth:   { user: login, pass: key },
//     });
//   }
//   return _smtpTransporter;
// }

// /**
//  * Send a transactional email via Brevo SMTP relay.
//  * @param {{ to: string, subject: string, html: string, name?: string }} opts
//  */
// export async function sendBrevoEmail({ to, subject, html, name }) {
//   const transporter = getSmtpTransporter();

//   if (!transporter) {
//     console.warn("[Brevo] BREVO_SMTP_LOGIN / BREVO_SMTP_KEY not set – email skipped for", to);
//     return { messageId: null };
//   }

//   const info = await transporter.sendMail({
//     from:    `"${env.mailFromName || "LiteEvent"}" <${env.mailFromEmail}>`,
//     to:      name ? `"${name}" <${to}>` : to,
//     subject,
//     html,
//   });

//   console.log("[Brevo SMTP] Email sent:", info.messageId, "→", to);
//   return { messageId: info.messageId };
// }

// /* ── REST API client (SMS + WhatsApp) ────────────────────────────── */

// let _restClient = null;

// function getRestClient() {
//   if (!env.brevoApiKey) return null;
//   if (!_restClient) {
//     _restClient = new BrevoClient({ apiKey: env.brevoApiKey });
//   }
//   return _restClient;
// }

// /* ── SMS ──────────────────────────────────────────────────────────── */

// /**
//  * Send a transactional SMS via Brevo REST API.
//  * Phone number must include country code, e.g. +12125551234
//  * Requires BREVO_API_KEY (REST API key from Brevo dashboard → API Keys section).
//  * @param {{ to: string, message: string }} opts
//  */
// export async function sendBrevoSms({ to, message }) {
//   const client = getRestClient();
//   if (!client) {
//     console.warn("[Brevo] BREVO_API_KEY not set – SMS skipped for", to);
//     return { messageId: null };
//   }

//   try {
//     const result = await client.transactionalSms.sendTransacSms({
//       sender:    (env.brevoSmsSender || "LiteEvent").slice(0, 11),
//       recipient: to.replace(/\s+/g, ""),
//       content:   message,
//       type:      "transactional",
//     });

//     const messageId = result?.body?.messageId ?? result?.messageId ?? null;
//     console.log("[Brevo] SMS sent:", messageId, "→", to);
//     return { messageId };
//   } catch (err) {
//     const detail = err?.body ?? err?.response?.body ?? err?.message ?? err;
//     console.error("[Brevo] SMS error:", JSON.stringify(detail));
//     throw new Error(`Brevo SMS failed: ${JSON.stringify(detail)}`);
//   }
// }

// /* ── WhatsApp ─────────────────────────────────────────────────────── */

// /**
//  * Send a WhatsApp template message via Brevo REST API.
//  * Requires BREVO_API_KEY and a pre-approved template in Brevo dashboard.
//  * @param {{ to: string, templateId: number, params?: Record<string, string> }} opts
//  */
// export async function sendBrevoWhatsapp({ to, templateId, params = {} }) {
//   const client = getRestClient();
//   if (!client) {
//     console.warn("[Brevo] BREVO_API_KEY not set – WhatsApp skipped for", to);
//     return { messageId: null };
//   }

//   try {
//     const result = await client.transactionalWhatsApp.sendWhatsappMessage({
//       templateId,
//       senderNumber:   to.replace(/\s+/g, ""),
//       contactNumbers: [to.replace(/\s+/g, "")],
//       params,
//     });

//     const messageId = result?.body?.messageId ?? result?.messageId ?? null;
//     console.log("[Brevo] WhatsApp sent:", messageId, "→", to);
//     return { messageId };
//   } catch (err) {
//     const detail = err?.body ?? err?.response?.body ?? err?.message ?? err;
//     console.error("[Brevo] WhatsApp error:", JSON.stringify(detail));
//     throw new Error(`Brevo WhatsApp failed: ${JSON.stringify(detail)}`);
//   }
// }




/**
 * api/services/brevo.service.js
 *
 * Unified Brevo service for:
 * - Email (SMTP via Nodemailer)
 * - SMS (REST API)
 * - WhatsApp (REST API)
 *
 * Required environment variables:
 *
 * # Email (SMTP)
 * BREVO_SMTP_LOGIN=your@email.com
 * BREVO_SMTP_KEY=xsmtpsib-xxxxxxxxxxxx
 *
 * # REST API (SMS + WhatsApp)
 * BREVO_API_KEY=xkeysib-xxxxxxxxxxxx
 *
 * # Sender configuration
 * MAIL_FROM_EMAIL=no-reply@yourdomain.com
 * MAIL_FROM_NAME=LiteEvent
 *
 * # SMS sender (max 11 characters)
 * BREVO_SMS_SENDER=LiteEvent
 *
 * # WhatsApp approved sender number (no + sign required, but allowed)
 * BREVO_WHATSAPP_SENDER=14155552671
 */

import nodemailer from "nodemailer";
import { env } from "../config/env.js";

/* -------------------------------------------------------------------------- */
/* Utilities                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Normalize phone number by removing spaces, dashes, parentheses, etc.
 * Keeps leading + if present.
 */
function normalizePhone(phone) {
  const raw = String(phone || "").trim();
  const digits = raw.replace(/\D/g, "");

  if (!digits) return "";
  if (raw.startsWith("+")) return `+${digits}`;
  if (raw.startsWith("00")) return `+${digits.slice(2)}`;

  // A national number cannot be delivered reliably because the API has no
  // country context. Keep it invalid instead of guessing a country code.
  return digits;
}

function deliveryError(message, code = "SMS_DELIVERY_FAILED", statusCode = 502) {
  const error = new Error(message);
  error.code = code;
  error.statusCode = statusCode;
  return error;
}

function validateSmsRecipient(phone) {
  const recipient = normalizePhone(phone);

  if (!recipient.startsWith("+") || !/^\+\d{6,15}$/.test(recipient)) {
    throw deliveryError(
      "Use a mobile number with its country code, for example +1 202 555 0123.",
      "INVALID_SMS_PHONE",
      400,
    );
  }

  return recipient;
}

/**
 * Safe JSON stringify for logging.
 */
function safeStringify(value) {
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

/* -------------------------------------------------------------------------- */
/* Email (SMTP)                                                               */
/* -------------------------------------------------------------------------- */

let smtpTransporter = null;

/**
 * Create and cache Nodemailer SMTP transporter.
 */
function getSmtpTransporter() {
  const login = env.brevoSmtpLogin;
  const key = env.brevoSmtpKey;

  if (!login || !key) {
    return null;
  }

  if (!smtpTransporter) {
    smtpTransporter = nodemailer.createTransport({
      host: "smtp-relay.brevo.com",
      port: 587,
      secure: false,
      auth: {
        user: login,
        pass: key,
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 10000,
    });
  }

  return smtpTransporter;
}

/**
 * Send transactional email via Brevo SMTP.
 *
 * @param {Object} options
 * @param {string} options.to
 * @param {string} options.subject
 * @param {string} options.html
 * @param {string} [options.text]
 * @param {string} [options.name]
 */
export async function sendBrevoEmail({
  to,
  subject,
  html,
  text,
  name,
}) {
  if (!to || !subject || !html) {
    throw new Error(
      "sendBrevoEmail requires: to, subject, and html"
    );
  }

  const transporter = getSmtpTransporter();

  if (!transporter) {
    console.warn(
      `[Brevo] Email skipped: SMTP credentials not configured (${to})`
    );
    return { messageId: null };
  }

  const fromName = env.mailFromName || "LiteEvent";
  const fromEmail = env.mailFromEmail;

  if (!fromEmail) {
    throw new Error("MAIL_FROM_EMAIL is not configured");
  }

  let info;
  try {
    info = await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: name ? `"${name}" <${to}>` : to,
      subject,
      html,
      text,
    });
  } catch (err) {
    console.error(`[Brevo SMTP] ❌ Failed to send to ${to} — ${err.message}`);
    console.error(`[Brevo SMTP]    Login: ${env.brevoSmtpLogin}`);
    console.error(`[Brevo SMTP]    From:  ${fromEmail}`);
    console.error(`[Brevo SMTP]    Code:  ${err.code}  ResponseCode: ${err.responseCode}`);
    throw err;
  }

  console.log(`[Brevo SMTP] ✅ Email sent: ${info.messageId} -> ${to}`);

  return {
    messageId: info.messageId,
    response: info.response,
  };
}

/* -------------------------------------------------------------------------- */
/* REST API Client (SMS + WhatsApp)                                           */
/* -------------------------------------------------------------------------- */

let restClient = null;

/**
 * Create and cache Brevo REST client.
 */
async function getRestClient() {
  if (!env.brevoApiKey) {
    return null;
  }

  if (!restClient) {
    const { BrevoClient } = await import("@getbrevo/brevo");
    restClient = new BrevoClient({
      apiKey: env.brevoApiKey,
    });
  }

  return restClient;
}

/* -------------------------------------------------------------------------- */
/* SMS                                                                        */
/* -------------------------------------------------------------------------- */

/**
 * Send transactional SMS.
 *
 * @param {Object} options
 * @param {string} options.to
 * @param {string} options.message
 */
export async function sendBrevoSms({ to, message }) {
  if (!to || !message) {
    throw deliveryError("sendBrevoSms requires: to and message", "INVALID_SMS_REQUEST", 400);
  }

  const client = await getRestClient();

  if (!client) {
    throw deliveryError(
      "SMS is not configured. Add BREVO_API_KEY to the API service before sending SMS.",
      "SMS_NOT_CONFIGURED",
      503,
    );
  }

  const recipient = validateSmsRecipient(to);
  const sender = (env.brevoSmsSender || "LiteEvent").slice(0, 11);

  if (!/^[A-Za-z0-9]{1,11}$/.test(sender)) {
    throw deliveryError(
      "BREVO_SMS_SENDER must contain only letters and numbers and be at most 11 characters.",
      "INVALID_SMS_SENDER",
      503,
    );
  }

  try {
    const result =
      await client.transactionalSms.sendAsyncTransactionalSms({
        sender,
        recipient,
        content: message,
        type: "transactional",
      });

    const messageId =
      result?.body?.messageId ??
      result?.messageId ??
      null;

    if (!messageId) {
      throw deliveryError(
        "Brevo did not confirm the SMS request. Please try again.",
        "SMS_NOT_ACCEPTED",
        502,
      );
    }

    console.log(`[Brevo] SMS accepted: ${messageId} -> ${recipient}`);

    return {
      messageId,
      raw: result,
    };
  } catch (error) {
    const detail =
      error?.body ??
      error?.response?.body ??
      error?.message ??
      error;

    console.error(
      `[Brevo] SMS error for ${recipient}: ${safeStringify(detail)}`
    );

    if (error?.code && error?.statusCode) throw error;

    throw deliveryError(
      `Brevo SMS failed for ${recipient}: ${safeStringify(detail)}`,
    );
  }
}

/* -------------------------------------------------------------------------- */
/* WhatsApp                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Send WhatsApp template message.
 *
 * IMPORTANT:
 * - templateId must be an approved template in Brevo.
 * - BREVO_WHATSAPP_SENDER must be your approved WhatsApp business number.
 *
 * @param {Object} options
 * @param {string} options.to
 * @param {number} options.templateId
 * @param {Object} [options.params]
 */
export async function sendBrevoWhatsapp({
  to,
  templateId,
  params = {},
}) {
  if (!to || !templateId) {
    throw new Error(
      "sendBrevoWhatsapp requires: to and templateId"
    );
  }

  const client = getRestClient();

  if (!client) {
    console.warn(
      `[Brevo] WhatsApp skipped: BREVO_API_KEY not configured (${to})`
    );
    return { messageId: null };
  }

  const recipient = normalizePhone(to);
  const senderNumber = normalizePhone(
    env.brevoWhatsappSender
  );

  if (!senderNumber) {
    throw new Error(
      "BREVO_WHATSAPP_SENDER is not configured"
    );
  }

  try {
    const result =
      await client.transactionalWhatsApp.sendWhatsappMessage({
        templateId,
        senderNumber,
        contactNumbers: [recipient],
        params,
      });

    const messageId =
      result?.body?.messageId ??
      result?.messageId ??
      null;

    console.log(
      `[Brevo] WhatsApp sent: ${messageId} -> ${recipient}`
    );

    return {
      messageId,
      raw: result,
    };
  } catch (error) {
    const detail =
      error?.body ??
      error?.response?.body ??
      error?.message ??
      error;

    console.error(
      `[Brevo] WhatsApp error for ${recipient}: ${safeStringify(detail)}`
    );

    throw new Error(
      `Brevo WhatsApp failed for ${recipient}: ${safeStringify(detail)}`
    );
  }
}

/* -------------------------------------------------------------------------- */
/* Optional Generic Notification Helper                                       */
/* -------------------------------------------------------------------------- */

/**
 * Send notification using selected channel.
 *
 * @example
 * await sendNotification({
 *   channel: "email",
 *   to: "user@example.com",
 *   subject: "Welcome",
 *   html: "<h1>Hello</h1>",
 * });
 */
export async function sendNotification({
  channel,
  ...options
}) {
  switch (channel) {
    case "email":
      return sendBrevoEmail(options);

    case "sms":
      return sendBrevoSms(options);

    case "whatsapp":
      return sendBrevoWhatsapp(options);

    default:
      throw new Error(`Unsupported channel: ${channel}`);
  }
}
