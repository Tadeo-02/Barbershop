import pino from "pino";

const isProduction = process.env.NODE_ENV === "production";

const level = process.env.LOG_LEVEL || (isProduction ? "info" : "debug");

const logger = pino({
  level,
  transport: !isProduction
    ? { target: "pino-pretty", options: { colorize: true } }
    : undefined,
  base: { pid: false },
});

export default logger;
