import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { config } from "./config/env.js";
import { errorHandler } from "./middlewares/errorHandler.middleware.js";
import { NotFoundError } from "./utils/appError.js";

// Routes
import authRoutes from "./routes/auth.routes.js";
import chatRoutes from "./routes/chat.routes.js";
import memoryRoutes from "./routes/memory.routes.js";
import reminderRoutes from "./routes/reminder.routes.js";
import vtubeRoutes from "./routes/vtube.routes.js";
import healthRoutes from "./routes/health.routes.js";

/**
 * Initialise the Express application with common middlewares.
 * Helmet adds basic security headers, and Morgan logs incoming requests.
 */
const app = express();
app.use(helmet());
app.use(morgan('combined'));

// CORS Configuration
const originSetting = config.frontendUrl === "*" ? true : config.frontendUrl.split(",").map((s) => s.trim());
app.use(cors({ origin: originSetting }));

app.use(express.json({ limit: "1mb" }));

// Route Mappings
app.use("/api/auth", authRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/memory", memoryRoutes);
app.use("/api/reminders", reminderRoutes);
app.use("/api/vtube", vtubeRoutes);
app.use("/api/health", healthRoutes);

// Backward Compatibility for Legacy /chat Endpoint
app.use("/chat", chatRoutes);

// 404 Handler
app.use((req, res, next) => {
  next(new NotFoundError(`Endpoint [${req.method}] ${req.originalUrl} not found`));
});

// Centralized Global Error Handler
app.use(errorHandler);

/**
 * The configured Express application.
 * Exported for use in the server entry point and for testing.
 */
export default app;
