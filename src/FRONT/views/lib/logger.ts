const isProd = import.meta.env.PROD;

const logger = {
  debug: (...args: unknown[]) => {
    if (!isProd) console.debug("[DEBUG]", ...args);
  },
  info: (...args: unknown[]) => {
    if (!isProd) console.info("[INFO]", ...args);
  },
  warn: (...args: unknown[]) => {
    console.warn("[WARN]", ...args);
  },
  error: (...args: unknown[]) => {
    console.error("[ERROR]", ...args);
  },
};

export default logger;
