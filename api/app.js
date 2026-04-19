import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import compression from "compression";
import hpp from "hpp";
import rateLimit from "express-rate-limit";

import { swaggerUi, swaggerSpec } from "./config/swagger.js";
import { env } from "./config/env.js";

import routes from "./routes/index.js";
//import  authRoutes from "./routes/auth.routes.js"
import webhookRoutes from "./routes/webhooks.routes.js";

import { requestLogger } from "./middleware/logger.middleware.js";
import publicPagesRoutes from "./routes/public-pages.routes.js";




const app = express();

/*
|--------------------------------------------------------------------------
| Trust proxy (for nginx / docker / cloud load balancers)
|--------------------------------------------------------------------------
*/

app.set("trust proxy", 1);

/*



/*
|--------------------------------------------------------------------------
| Security Middlewares
|--------------------------------------------------------------------------
*/

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);

app.use(hpp());
app.use(compression());

/*
|--------------------------------------------------------------------------
| Request Logger
|--------------------------------------------------------------------------
*/

app.use(requestLogger);

/*
|--------------------------------------------------------------------------
| CORS
|--------------------------------------------------------------------------
*/

const allowedOrigins = (env.CORS_ORIGIN || "http://localhost:3000")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);

      if (allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("CORS not allowed for this origin"));
    },
    credentials: true,
  }),
);

/*
|--------------------------------------------------------------------------
| Body Parsers
|--------------------------------------------------------------------------
*/
// ✅ Stripe FIRST
app.use("/webhooks/stripe", express.raw({ type: "application/json" }));

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));
app.use(cookieParser());

/*
|--------------------------------------------------------------------------
| Rate Limiter
|--------------------------------------------------------------------------
*/

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests, try again later.",
  },
});

app.use("/api", globalLimiter);

app.use((req, res, next) => {
  (console.log(" request:", req.method, req.url), next());
});

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/
//app.use("/auth", authRoutes)
app.use("/api", routes);
app.use("/webhooks", webhookRoutes);
app.use("/api", publicPagesRoutes);
app.use("/api/public", publicPagesRoutes);

/*
|--------------------------------------------------------------------------
| Swagger Docs
|--------------------------------------------------------------------------
*/

app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

/*
|--------------------------------------------------------------------------
| Health Check
|--------------------------------------------------------------------------
*/

app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "API is healthy",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
  });
});

/*
|--------------------------------------------------------------------------
| Root
|--------------------------------------------------------------------------
*/

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Welcome to Event Platform API",
    version: "1.0.0",
    docs: "/api/docs",
    health: "/health",
  });
});

/*
|--------------------------------------------------------------------------
| 404 Handler
|--------------------------------------------------------------------------
*/

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

/*
|--------------------------------------------------------------------------
| Global Error Handler
|--------------------------------------------------------------------------
*/

app.use((err, req, res, next) => {
  console.error("Global error:", err);

  if (err.message === "CORS not allowed for this origin") {
    return res.status(403).json({
      success: false,
      message: err.message,
    });
  }

  if (err.type === "entity.parse.failed") {
    return res.status(400).json({
      success: false,
      message: "Invalid JSON payload",
    });
  }

  return res.status(err.status || 500).json({
    success: false,
    message:
      env.NODE_ENV === "production"
        ? "Internal server error"
        : err.message || "Internal server error",
    ...(env.NODE_ENV !== "production" && { stack: err.stack }),
  });
});

export default app;

//fffffffffffffffffffffffffffffffffff

// import express from "express";
// import helmet from "helmet";
// import cors from "cors";
// import cookieParser from "cookie-parser";
// import compression from "compression";
// import hpp from "hpp";
// import rateLimit from "express-rate-limit";
// import { swaggerUi, swaggerSpec } from "./config/swagger.js";
// import { initWebSocket } from "./config/websocket.js";

// // import swaggerUi from "swagger-ui-express";
// // import YAML from "yamljs";

// import routes from "./routes/index.js";
// import { env } from "./config/env.js";

// import { requestLogger } from "./middleware/logger.middleware.js";
// import router from "./routes/index.js";
// import publicTicketsRoutes from "./routes/public.tickets.routes.js";
// import ticketCheckinRoutes from "./routes/ticket-checkin.routes.js";
// import webhookRoutes from "./routes/webhooks.routes.js";

// const app = express();

// app.use("/webhooks", webhookRoutes);

// /*
// Trust proxy (important when using nginx / docker / load balancers)
// */
// app.set("trust proxy", 1);

// /*
// Load OpenAPI file
// */
// ///#let openApiDocument = null;

// ///# try {
// //   openApiDocument = YAML.load("./docs/openapi.yaml");
// // } catch (error) {
// //   console.warn("OpenAPI file not loaded:", error.message);
// // }

// /*
// Security Middlewares
// */
// app.use(
//   helmet({
//     crossOriginResourcePolicy: { policy: "cross-origin" },
//   })
// );

// app.use(hpp());
// app.use(compression());
// app.use(requestLogger);

// /*
// CORS
// */
// const allowedOrigins = (env.CORS_ORIGIN || "")
//   .split(",")
//   .map((origin) => origin.trim())
//   .filter(Boolean);

// app.use(
//   cors({
//     origin(origin, callback) {

//       if (!origin) return callback(null, true);

//       if (allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
//         return callback(null, true);
//       }

//       return callback(new Error("CORS not allowed for this origin"));
//     },
//     credentials: true,
//   })
// );

// /*
// Body parsers
// */
// app.use(express.json({ limit: "2mb" }));
// app.use(express.urlencoded({ extended: true, limit: "2mb" }));
// app.use(cookieParser());

// /*
// Simple request logger
// */
// app.use((req, res, next) => {

//   const start = Date.now();

//   res.on("finish", () => {

//     const duration = Date.now() - start;

//     console.log(
//       `${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`
//     );

//   });

//   next();

// });

// /*
// Rate limiter
// */
// const globalLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000,
//   max: 300,
//   standardHeaders: true,
//   legacyHeaders: false,
//   message: {
//     success: false,
//     message: "Too many requests, try again later.",
//   },
// });

// app.use("/api", globalLimiter);

// app.use("/api", router);
// app.use("/api", publicTicketsRoutes);
// app.use("/api", ticketCheckinRoutes);

// /*
// Health check
// */
// app.get("/health", (req, res) => {

//   res.status(200).json({
//     success: true,
//     message: "API is healthy",
//     uptime: process.uptime(),
//     timestamp: new Date().toISOString(),
//     environment: env.NODE_ENV,
//   });

// });

// /*
// Swagger docs
// */
// ///# if (openApiDocument) {
// //   app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(openApiDocument));
// // }

// /*
// Root route
// */
// app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// app.get("/", (req, res) => {

//   res.json({
//     success: true,
//     message: "Welcome to Event Platform API",
//     version: "1.0.0",
//     docs: "/api/docs",
//     health: "/health",
//   });

// });

// /*
// API Routes
// */
// app.use("/api", routes);

// /*
// 404 handler
// */
// app.use((req, res) => {

//   res.status(404).json({
//     success: false,
//     message: `Route not found: ${req.method} ${req.originalUrl}`,
//   });

// });

// /*
// Global error handler

// */
// initWebSocket(server);

// app.use((err, req, res, next) => {

//   console.error("Global error:", err);

//   if (err.message === "CORS not allowed for this origin") {
//     return res.status(403).json({
//       success: false,
//       message: err.message,
//     });
//   }

//   if (err.type === "entity.parse.failed") {
//     return res.status(400).json({
//       success: false,
//       message: "Invalid JSON payload",
//     });
//   }

//   return res.status(err.status || 500).json({
//     success: false,
//     message:
//       env.NODE_ENV === "production"
//         ? "Internal server error"
//         : err.message || "Internal server error",
//     ...(env.NODE_ENV !== "production" && { stack: err.stack }),
//   });

// });

// export default app;
