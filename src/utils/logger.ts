function formatArg(arg: unknown): string {
  if (typeof arg === 'string') return arg;
  if (arg instanceof Error) return arg.message;
  try {
    return JSON.stringify(arg);
  } catch {
    return String(arg);
  }
}

function formatMessage(msg: unknown, ...args: unknown[]): string {
  return [msg, ...args].map(formatArg).join(' ');
}

function debug(msg: unknown, ...args: unknown[]): void {
  console.log(`::debug::${formatMessage(msg, ...args)}`);
}

function info(msg: unknown, ...args: unknown[]): void {
  console.log(`::notice::${formatMessage(msg, ...args)}`);
}

function warn(msg: unknown, ...args: unknown[]): void {
  console.log(`::warning::${formatMessage(msg, ...args)}`);
}

function error(msg: unknown, ...args: unknown[]): void {
  console.log(`::error::${formatMessage(msg, ...args)}`);
}

const log = (m: unknown, ...args: unknown[]): void => debug(m, ...args);

log.debug = (m: unknown, ...args: unknown[]): void => debug(m, ...args);
log.info = (m: unknown, ...args: unknown[]): void => info(m, ...args);
log.warn = (m: unknown, ...args: unknown[]): void => warn(m, ...args);
log.error = (m: unknown, ...args: unknown[]): void => error(m, ...args);

export default log;
