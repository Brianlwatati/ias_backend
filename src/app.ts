// src/app.ts

import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";

import { env } from "./config/env.js";
import { db } from "./config/database.js";
import routes from "./routes/routes.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { generalRateLimiter } from "./middleware/rateLimiters.js";
import { ForbiddenError } from "./errors/ForbiddenError.js";

export const app = express();

app.disable("x-powered-by");

app.use(helmet());

const allowedOrigins = env.CORS_ORIGIN.split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new ForbiddenError("Not allowed by CORS"));
      }
    },
    credentials: true,
  }),
);

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

app.use(cookieParser());

/**
 * Health check is intentionally registered BEFORE the
 * rate limiter so load balancers / uptime monitors /
 * container orchestrators never get a false "unhealthy"
 * signal from being rate-limited during a traffic spike.
 */
app.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Auth service is healthy",
  });
});

app.use(generalRateLimiter);

app.use(env.API_PREFIX, routes(db));

// Must be registered after routes
app.use(errorHandler);
