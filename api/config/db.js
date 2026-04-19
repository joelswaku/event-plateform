import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

export const db = new Pool({
  connectionString: process.env.DATABASE_URL
});

export async function connectDatabase(logger) {
  try {
    await db.query("SELECT 1");
    logger.info("PostgreSQL connected");
  } catch (error) {
    logger.error("Database connection failed", error);
    process.exit(1);
  }
}




















// import http from "http"
// import app from "./app.js"
// import dotenv from "dotenv"
// import pino from "pino"

// import { connectDatabase, db } from "../config/db.js"

// dotenv.config()

// const logger = pino({
//   transport: {
//     target: "pino-pretty"
//   }
// })

// const PORT = process.env.PORT || 5000

// const server = http.createServer(app)

// async function startServer() {

//   await connectDatabase(logger)

//   server.listen(PORT, () => {
//     logger.info(`Server running on port ${PORT}`)
//   })

// }

// startServer()

// async function shutdown() {

//   logger.info("Shutting down server...")

//   try {

//     await db.end()

//     server.close(() => {
//       logger.info("Server closed")
//       process.exit(0)
//     })

//   } catch (error) {

//     logger.error("Shutdown error", error)
//     process.exit(1)

//   }

// }

// process.on("SIGINT", shutdown)
// process.on("SIGTERM", shutdown)











