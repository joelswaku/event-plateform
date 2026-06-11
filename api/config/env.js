
import dotenv from "dotenv";

dotenv.config();

export const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: process.env.PORT || 5000,
  DATABASE_URL: process.env.DATABASE_URL || "",
  JWT_SECRET: process.env.JWT_SECRET || "",
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || "",
  CORS_ORIGIN: process.env.CORS_ORIGIN || "http://localhost:3000",

  frontendUrl: process.env.FRONTEND_URL || "http://localhost:3000",

  /* Resend — transactional email (preferred) */
  resendApiKey: process.env.RESEND_API_KEY || "",

  /* Brevo — Email via SMTP relay */
  brevoSmtpLogin: process.env.BREVO_SMTP_LOGIN || "",  // your Brevo account email
  brevoSmtpKey:   process.env.BREVO_SMTP_KEY   || "",  // xsmtpsib-... key

  /* Brevo — SMS + WhatsApp via REST API */
  brevoApiKey:    process.env.BREVO_API_KEY    || "",  // xkeysib-... key
  brevoSmsSender: process.env.BREVO_SMS_SENDER || "LiteEvent",

  mailFromEmail: process.env.MAIL_FROM_EMAIL || "noreply@liteevent.app",
  mailFromName:  process.env.MAIL_FROM_NAME  || "LiteEvent",

  /* Legacy SMTP fallback (used when BREVO_SMTP_KEY is not set) */
  smtpHost: process.env.SMTP_HOST,
  smtpPort: process.env.SMTP_PORT || 587,
  smtpUser: process.env.SMTP_USER,
  smtpPass: process.env.SMTP_PASS,

  googleClientId:      process.env.GOOGLE_CLIENT_ID,
  googleClientSecret:  process.env.GOOGLE_CLIENT_SECRET,
  googleRedirectUri:   process.env.GOOGLE_REDIRECT_URI,
  stripeSecretKey:     process.env.STRIPE_SECRET_KEY,
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET,

  anthropicApiKey: process.env.ANTHROPIC_API_KEY || "",
};