const isProduction = process.env.NODE_ENV === "production";

const allowVerboseLogs =
  !isProduction || process.env.NEXT_PUBLIC_DEBUG_MODE === "true";

const emailPattern = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const tokenPattern =
  /(Bearer\s+)?[A-Za-z0-9\-_=]{20,}\.[A-Za-z0-9\-_=]{20,}\.?[A-Za-z0-9\-_.+/=]*/g;

function sanitizeValue(value: unknown): unknown {
  if (typeof value === "string") {
    return value
      .replace(emailPattern, "[redacted-email]")
      .replace(tokenPattern, "[redacted-token]");
  }
  return value;
}

function sanitizeArgs(args: unknown[]): unknown[] {
  return args.map(sanitizeValue);
}

export const safeConsole = {
  debug: (...args: unknown[]) => {
    if (!allowVerboseLogs) return;
    console.debug(...sanitizeArgs(args));
  },
  log: (...args: unknown[]) => {
    if (!allowVerboseLogs) return;
    console.log(...sanitizeArgs(args));
  },
  info: (...args: unknown[]) => {
    if (!allowVerboseLogs) return;
    console.info(...sanitizeArgs(args));
  },
  warn: (...args: unknown[]) => {
    if (!allowVerboseLogs) return;
    console.warn(...sanitizeArgs(args));
  },
};
