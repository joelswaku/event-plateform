// import http from "http";
// import dotenv from "dotenv";
// import pino from "pino";

// import app from "./app.js";
// import { connectDatabase, db } from "./config/db.js";

// dotenv.config();

// const logger = pino({
//   transport: {
//     target: "pino-pretty",
//   },
// });

// const PORT = process.env.PORT || 5000;

// const server = http.createServer(app);

// /*
// Start server
// */
// async function startServer() {
//   await connectDatabase(logger);

//   server.listen(PORT, () => {
//     logger.info(`Server running on port ${PORT}`);
//   });
// }

// startServer();

// /*
// Graceful shutdown
// */
// async function shutdown() {
//   logger.info("Shutting down server...");

//   try {
//     await db.end();

//     server.close(() => {
//       logger.info("Server closed");
//       process.exit(0);
//     });
//   } catch (error) {
//     logger.error("Shutdown error", error);
//     process.exit(1);
//   }
// }

// process.on("SIGINT", shutdown);
// process.on("SIGTERM", shutdown);

//fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff

//server.js
import http from "http";
import dotenv from "dotenv";
import pino from "pino";

import app from "./app.js";
import { connectDatabase, db } from "./config/db.js";
import { initWebSocket } from "./config/websocket.js";

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
async function startServer() {
  try {
    await connectDatabase(logger);

    server.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
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
