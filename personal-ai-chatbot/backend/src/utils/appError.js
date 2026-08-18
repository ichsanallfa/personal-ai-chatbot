export class AppError extends Error {
  constructor(message, statusCode = 500, errorCode = "INTERNAL_ERROR", details = null) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message, details = null) {
    super(message, 400, "VALIDATION_ERROR", details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized access", details = null) {
    super(message, 401, "UNAUTHORIZED", details);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Forbidden: insufficient permissions", details = null) {
    super(message, 403, "FORBIDDEN", details);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Resource not found", details = null) {
    super(message, 404, "NOT_FOUND", details);
  }
}

export class RateLimitError extends AppError {
  constructor(message = "Rate limit exceeded", retryAfterMs = 0) {
    super(message, 429, "RATE_LIMIT_EXCEEDED", { retryAfterMs });
  }
}
