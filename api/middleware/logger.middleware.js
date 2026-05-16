import pinoHttp from "pino-http";
import { logger } from "../config/logger.js";

export const requestLogger = pinoHttp({
  logger,

  // Skip CORS preflight and health checks — pure noise
  autoLogging: {
    ignore: (req) => req.method === "OPTIONS" || req.url === "/health",
  },

  customLogLevel(res, err) {
    if (res.statusCode >= 500 || err) return "error";
    if (res.statusCode >= 400) return "warn";
    return "silent"; // don't log successful requests at all
  },

  customSuccessMessage(req, res) {
    return `${req.method} ${req.url} ${res.statusCode}`;
  },

  // Strip headers, body, cookies — only keep what matters
  serializers: {
    req(req) {
      return { method: req.method, url: req.url };
    },
    res(res) {
      return { statusCode: res.statusCode };
    },
  },
});