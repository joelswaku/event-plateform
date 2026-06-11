
// //server.js
// import http from "http";
// import dotenv from "dotenv";
// import pino from "pino";

// import app from "./app.js";
// import { connectDatabase, db } from "./config/db.js";
// import { initWebSocket } from "./config/websocket.js";

// dotenv.config();

// const logger = pino({
//   transport: {
//     target: "pino-pretty",
//   },
// });

// const PORT = process.env.PORT || 5000;

// const server = http.createServer(app);

// /*
// |--------------------------------------------------------------------------
// | Initialize WebSocket server
// |--------------------------------------------------------------------------
// */
// initWebSocket(server);

// /*
// |--------------------------------------------------------------------------
// | Start server
// |--------------------------------------------------------------------------
// */
// async function startServer() {
//   try {
//     await connectDatabase(logger);

//     server.listen(PORT, () => {
//       logger.info(`Server running on port ${PORT}`);
//     });
//   } catch (error) {
//     logger.error(error, "Failed to start server");
//     process.exit(1);
//   }
// }

// startServer();

// /*
// |--------------------------------------------------------------------------
// | Graceful shutdown
// |--------------------------------------------------------------------------
// */
// async function shutdown(signal) {
//   logger.info(`${signal} received. Shutting down server...`);

//   try {
//     await new Promise((resolve, reject) => {
//       server.close((err) => {
//         if (err) return reject(err);
//         resolve();
//       });
//     });

//     await db.end();

//     logger.info("Server closed gracefully");
//     process.exit(0);
//   } catch (error) {
//     logger.error(error, "Shutdown error");
//     process.exit(1);
//   }
// }

// process.on("SIGINT", () => shutdown("SIGINT"));
// process.on("SIGTERM", () => shutdown("SIGTERM"));





// server.js
import http from "http";
import dotenv from "dotenv";
import pino from "pino";

import app from "./app.js";
import { connectDatabase, db } from "./config/db.js";
import { initWebSocket } from "./config/websocket.js";

// Optional test email function
import { sendWelcomeEmail } from "./utils/sendEmail.js"; 

dotenv.config();

const logger = pino({
  transport: {
    target: "pino-pretty",
  },
});

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

/*
|--------------------------------------------------------------------------
| Initialize WebSocket server
|--------------------------------------------------------------------------
*/
initWebSocket(server);

/*
|--------------------------------------------------------------------------
| Start server
|--------------------------------------------------------------------------
*/
async function applyTeamSchema() {
  try {
    await db.query(`ALTER TABLE event_invitations ADD COLUMN IF NOT EXISTS invite_code_hash TEXT`);
    await db.query(`ALTER TABLE event_invitations ADD COLUMN IF NOT EXISTS invited_name TEXT`);
    await db.query(`ALTER TABLE event_invitations ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'ADMIN'`);
    await db.query(`ALTER TABLE event_invitations ADD COLUMN IF NOT EXISTS user_id UUID`);
    await db.query(`ALTER TABLE event_invitations ADD COLUMN IF NOT EXISTS token UUID DEFAULT gen_random_uuid()`);
    await db.query(`ALTER TABLE event_members ADD COLUMN IF NOT EXISTS email TEXT`);
    await db.query(`ALTER TABLE organization_members ADD COLUMN IF NOT EXISTS email TEXT`);
    try { await db.query(`ALTER TABLE event_members ALTER COLUMN user_id DROP NOT NULL`); } catch {}
    logger.info("Team schema ready");
  } catch (err) {
    logger.warn({ err }, "Team schema migration warning (non-fatal)");
  }
}

async function applyVendorSchema() {
  const cols = [
    `ALTER TABLE vendors ADD COLUMN IF NOT EXISTS is_active           BOOLEAN      DEFAULT TRUE`,
    `ALTER TABLE vendors ADD COLUMN IF NOT EXISTS is_featured         BOOLEAN      DEFAULT FALSE`,
    `ALTER TABLE vendors ADD COLUMN IF NOT EXISTS category            VARCHAR(100) DEFAULT 'General'`,
    `ALTER TABLE vendors ADD COLUMN IF NOT EXISTS subcategories       TEXT[]`,
    `ALTER TABLE vendors ADD COLUMN IF NOT EXISTS slug                VARCHAR(255)`,
    `ALTER TABLE vendors ADD COLUMN IF NOT EXISTS tagline             VARCHAR(300)`,
    `ALTER TABLE vendors ADD COLUMN IF NOT EXISTS bio                 TEXT`,
    `ALTER TABLE vendors ADD COLUMN IF NOT EXISTS logo_url            TEXT`,
    `ALTER TABLE vendors ADD COLUMN IF NOT EXISTS cover_url           TEXT`,
    `ALTER TABLE vendors ADD COLUMN IF NOT EXISTS website_url         VARCHAR(512)`,
    `ALTER TABLE vendors ADD COLUMN IF NOT EXISTS phone               VARCHAR(50)`,
    `ALTER TABLE vendors ADD COLUMN IF NOT EXISTS city                VARCHAR(100)`,
    `ALTER TABLE vendors ADD COLUMN IF NOT EXISTS country             VARCHAR(100)`,
    `ALTER TABLE vendors ADD COLUMN IF NOT EXISTS service_area        VARCHAR(500)`,
    `ALTER TABLE vendors ADD COLUMN IF NOT EXISTS base_price          NUMERIC(12,2)`,
    `ALTER TABLE vendors ADD COLUMN IF NOT EXISTS currency            VARCHAR(10)  DEFAULT 'USD'`,
    `ALTER TABLE vendors ADD COLUMN IF NOT EXISTS price_label         VARCHAR(100) DEFAULT 'Starting from'`,
    `ALTER TABLE vendors ADD COLUMN IF NOT EXISTS verification_status VARCHAR(30)  DEFAULT 'pending'`,
    `ALTER TABLE vendors ADD COLUMN IF NOT EXISTS verification_score  INTEGER      DEFAULT 0`,
    `ALTER TABLE vendors ADD COLUMN IF NOT EXISTS tier                VARCHAR(20)  DEFAULT 'bronze'`,
    `ALTER TABLE vendors ADD COLUMN IF NOT EXISTS rating              NUMERIC(3,2) DEFAULT 0`,
    `ALTER TABLE vendors ADD COLUMN IF NOT EXISTS review_count        INTEGER      DEFAULT 0`,
    `ALTER TABLE vendors ADD COLUMN IF NOT EXISTS booking_count       INTEGER      DEFAULT 0`,
    `ALTER TABLE vendors ADD COLUMN IF NOT EXISTS profile_views       INTEGER      DEFAULT 0`,
    `ALTER TABLE vendors ADD COLUMN IF NOT EXISTS inquiry_count       INTEGER      DEFAULT 0`,
    `ALTER TABLE vendors ADD COLUMN IF NOT EXISTS response_time_hours INTEGER`,
    `ALTER TABLE vendors ADD COLUMN IF NOT EXISTS portfolio           JSONB        DEFAULT '[]'`,
    `ALTER TABLE vendors ADD COLUMN IF NOT EXISTS services            JSONB        DEFAULT '[]'`,
    `ALTER TABLE vendors ADD COLUMN IF NOT EXISTS social_links        JSONB        DEFAULT '{}'`,
    `ALTER TABLE vendors ADD COLUMN IF NOT EXISTS password_hash       TEXT`,
    `ALTER TABLE vendors ADD COLUMN IF NOT EXISTS created_at          TIMESTAMPTZ  DEFAULT NOW()`,
    `ALTER TABLE vendors ADD COLUMN IF NOT EXISTS updated_at          TIMESTAMPTZ  DEFAULT NOW()`,
  ];

  let fixed = 0;
  for (const sql of cols) {
    try { await db.query(sql + ";"); fixed++; } catch {}
  }

  // Backfill any NULL slugs
  try {
    await db.query(`
      UPDATE vendors
      SET slug = LOWER(REGEXP_REPLACE(COALESCE(business_name,'vendor'),'[^a-zA-Z0-9]+','-','g'))
               || '-' || SUBSTR(MD5(id::TEXT),1,6)
      WHERE slug IS NULL OR slug = ''
    `);
  } catch {}

  // Indexes (each wrapped individually so one failure doesn't block the rest)
  const indexes = [
    `CREATE INDEX IF NOT EXISTS idx_vendors_category ON vendors(category)`,
    `CREATE INDEX IF NOT EXISTS idx_vendors_active   ON vendors(is_active)`,
    `CREATE INDEX IF NOT EXISTS idx_vendors_rating   ON vendors(rating DESC)`,
    `CREATE UNIQUE INDEX IF NOT EXISTS idx_vendors_slug_uq ON vendors(slug) WHERE slug IS NOT NULL`,
  ];
  for (const idx of indexes) {
    try { await db.query(idx + ";"); } catch {}
  }

  logger.info(`Vendor schema ready (${fixed} columns verified)`);
}

async function applyOrganizerSchema() {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS organizers (
        id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name          VARCHAR(255) NOT NULL,
        email         VARCHAR(255) NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        company       VARCHAR(255),
        phone         VARCHAR(50),
        city          VARCHAR(100),
        country       VARCHAR(100),
        website       VARCHAR(512),
        event_types   TEXT[]      DEFAULT '{}',
        avatar_url    TEXT,
        bio           TEXT,
        is_active     BOOLEAN     DEFAULT TRUE,
        created_at    TIMESTAMPTZ DEFAULT NOW(),
        updated_at    TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_organizers_email  ON organizers(email)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_organizers_active ON organizers(is_active)`);
    await db.query(`
      CREATE TABLE IF NOT EXISTS organizer_saved_vendors (
        id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organizer_id UUID NOT NULL REFERENCES organizers(id) ON DELETE CASCADE,
        vendor_id    UUID NOT NULL REFERENCES vendors(id)    ON DELETE CASCADE,
        created_at   TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(organizer_id, vendor_id)
      )
    `);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_saved_vendors_org ON organizer_saved_vendors(organizer_id)`);
    logger.info("Organizer schema ready");
  } catch (err) {
    logger.warn({ err }, "Organizer schema warning (non-fatal)");
  }
}

async function startServer() {
  try {
    await connectDatabase(logger);
    await applyTeamSchema();
    await applyVendorSchema();
    await applyOrganizerSchema();

    server.listen(PORT, async () => {
      logger.info(`Server running on port ${PORT}`);

      /*
      |--------------------------------------------------------------------------
      | TEST EMAIL ON STARTUP
      |--------------------------------------------------------------------------
      | Set SEND_TEST_EMAIL=true in your .env to send a welcome email
      | automatically whenever the server starts.
      */
      if (process.env.SEND_TEST_EMAIL === "true") {
        try {
          logger.info("Sending test email...");

          const result = await sendWelcomeEmail({
            to: "joelswaku@gmail.com", // Change to your email
            name: "Joel",
          });

          logger.info(
            { result },
            "Test email sent successfully"
          );
        } catch (error) {
          logger.error(error, "Failed to send test email");
        }
      }
    });
  } catch (error) {
    logger.error(error, "Failed to start server");
    process.exit(1);
  }
}

startServer();

/*
|--------------------------------------------------------------------------
| Graceful shutdown
|--------------------------------------------------------------------------
*/
async function shutdown(signal) {
  logger.info(`${signal} received. Shutting down server...`);

  try {
    await new Promise((resolve, reject) => {
      server.close((err) => {
        if (err) return reject(err);
        resolve();
      });
    });

    await db.end();

    logger.info("Server closed gracefully");
    process.exit(0);
  } catch (error) {
    logger.error(error, "Shutdown error");
    process.exit(1);
  }
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));