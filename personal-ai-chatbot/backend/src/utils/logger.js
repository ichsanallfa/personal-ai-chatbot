const formatMessage = (level, message, ...args) => {
  const timestamp = new Date().toISOString();
  return `[${timestamp}] [${level.toUpperCase()}] ${message}`;
};

export const logger = {
  info: (message, ...args) => console.log(formatMessage("info", message), ...args),
  warn: (message, ...args) => console.warn(formatMessage("warn", message), ...args),
  error: (message, ...args) => console.error(formatMessage("error", message), ...args),
  debug: (message, ...args) => {
    if (process.env.DEBUG || process.env.NODE_ENV === "development") {
      console.debug(formatMessage("debug", message), ...args);
    }
  },
};
