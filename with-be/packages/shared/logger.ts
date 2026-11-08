export type LogLevel = "debug" | "error" | "info" | "warn";

export interface Logger {
  debug: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
  info: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
}

export let logger: Logger = console;

export const setLogger = (l: Logger) => {
  logger = l;
};
