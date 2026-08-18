import { ValidationError } from "../utils/appError.js";

/**
 * Validates request body, params, or query based on schema validator rules
 */
export const validate = (schema) => {
  return (req, res, next) => {
    const errors = [];

    if (schema.body) {
      for (const [field, rules] of Object.entries(schema.body)) {
        const val = req.body?.[field];

        if (rules.required && (val === undefined || val === null || val === "")) {
          errors.push({ field, location: "body", message: `${field} is required` });
          continue;
        }

        if (val !== undefined && val !== null) {
          if (rules.type && typeof val !== rules.type) {
            errors.push({ field, location: "body", message: `${field} must be of type ${rules.type}` });
          }

          if (rules.minLength && typeof val === "string" && val.trim().length < rules.minLength) {
            errors.push({ field, location: "body", message: `${field} must be at least ${rules.minLength} characters` });
          }

          if (rules.maxLength && typeof val === "string" && val.length > rules.maxLength) {
            errors.push({ field, location: "body", message: `${field} must not exceed ${rules.maxLength} characters` });
          }

          if (rules.enum && !rules.enum.includes(val)) {
            errors.push({ field, location: "body", message: `${field} must be one of: ${rules.enum.join(", ")}` });
          }
        }
      }
    }

    if (errors.length > 0) {
      return next(new ValidationError("Request validation failed", errors));
    }

    return next();
  };
};
