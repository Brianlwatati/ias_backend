import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";

import { env } from "./config/env.js";
import { db } from "./config/database.js";
import routes from "./routes/routes.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { generalRateLimiter } from "./middleware/rateLimiters.js";

export const app = express();

app.disable("x-powered-by");

/**
 * -------------------------------------------------------
 * Security headers
 * -------------------------------------------------------
 */
app.use(helmet());

/**
 * -------------------------------------------------------
 * CORS
 * -------------------------------------------------------
 *
 * Example:
 *
 * CORS_ORIGIN=http://localhost:3000
 *
 * Multiple origins:
 *
 * CORS_ORIGIN=http://localhost:3000,http://127.0.0.1:3000
 */
const allowedOrigins = env.CORS_ORIGIN.split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

console.log("Allowed CORS origins:", allowedOrigins);

app.use(
  cors({
    origin: (origin, callback) => {
      /**
       * Requests without an Origin header can occur from:
       *
       * - Postman
       * - Hoppscotch
       * - curl
       * - server-to-server requests
       *
       * We allow these requests.
       */
      if (!origin) {
        callback(null, true);
        return;
      }

      /**
       * Allow configured frontend origins.
       */
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      /**
       * Reject unknown browser origins.
       */
      console.warn(`CORS blocked origin: ${origin}`);

      callback(new Error(`CORS blocked origin: ${origin}`));
    },

    /**
     * Required when using cookies.
     */
    credentials: true,

    /**
     * Explicitly allow the HTTP methods
     * used by our API.
     */
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],

    /**
     * Headers that the frontend is allowed
     * to send.
     */
    allowedHeaders: [
      "Origin",
      "X-Requested-With",
      "Content-Type",
      "Accept",
      "Authorization",
    ],

    /**
     * Headers exposed to the browser.
     */
    exposedHeaders: [],

    /**
     * Cache preflight responses.
     */
    maxAge: 86400,
  }),
);

/**
 * -------------------------------------------------------
 * Body parsing
 * -------------------------------------------------------
 */
app.use(
  express.json({
    limit: "1mb",
  }),
);

app.use(
  express.urlencoded({
    extended: false,
    limit: "1mb",
  }),
);

/**
 * -------------------------------------------------------
 * Cookies
 * -------------------------------------------------------
 */
app.use(cookieParser());

/**
 * -------------------------------------------------------
 * Health check
 * -------------------------------------------------------
 *
 * Registered before the rate limiter so that:
 *
 * - Load balancers
 * - Docker health checks
 * - Kubernetes probes
 * - Uptime monitors
 *
 * don't get blocked by the application rate limiter.
 */
app.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Auth service is healthy",
  });
});

/**
 * -------------------------------------------------------
 * General rate limiting
 * -------------------------------------------------------
 */
app.use(generalRateLimiter);

/**
 * -------------------------------------------------------
 * API routes
 * -------------------------------------------------------
 *
 * If:
 *
 * API_PREFIX=/api
 *
 * and routes.ts contains:
 *
 * /auth/login
 *
 * the final endpoint becomes:
 *
 * POST /api/auth/login
 */
app.use(env.API_PREFIX, routes(db));

/**
 * -------------------------------------------------------
 * Global error handler
 * -------------------------------------------------------
 *
 * MUST remain after all routes and middleware
 * that can forward errors to it.
 */
app.use(errorHandler);
