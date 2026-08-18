import { AppError } from "../utils/appError.js";
import { logger } from "../utils/logger.js";

export const errorHandler = (err, req, res, next) => {
  logger.error(`API Error on [${req.method}] ${req.originalUrl}:`, err.message);

  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({
      success: false,
      error: {
        code: "INVALID_JSON",
        message: "Invalid JSON payload in request body",
        details: null,
      },
    });
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.errorCode,
        message: err.message,
        details: err.details,
      },
    });
  }

  const statusCode = err.status || err.statusCode || 500;
  const message = process.env.NODE_ENV === "production" && statusCode === 500
    ? "An unexpected internal server error occurred"
    : err.message || "Internal server error";

  return res.status(statusCode).json({
    success: false,
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message,
      details: null,
    },
  });
};
