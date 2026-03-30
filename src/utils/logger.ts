export type LogLevel = "debug" | "info" | "error";

const levelWeights: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  error: 30
};

export interface Logger {
  debug(message: string, meta?: unknown): void;
  info(message: string, meta?: unknown): void;
  error(message: string, meta?: unknown): void;
}

export function createLogger(level: LogLevel = "info"): Logger {
  const shouldLog = (target: LogLevel) => levelWeights[target] >= levelWeights[level];

  const write = (target: LogLevel, message: string, meta?: unknown) => {
    if (!shouldLog(target)) {
      return;
    }

    const prefix = `[fragmenta:${target}]`;
    if (meta === undefined) {
      console[target === "error" ? "error" : "log"](`${prefix} ${message}`);
      return;
    }

    console[target === "error" ? "error" : "log"](`${prefix} ${message}`, meta);
  };

  return {
    debug: (message, meta) => write("debug", message, meta),
    info: (message, meta) => write("info", message, meta),
    error: (message, meta) => write("error", message, meta)
  };
}
