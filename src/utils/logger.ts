function debug(msg: unknown, ...args: unknown[]): void {
  const message = [msg, ...args].join(' ');
  console.log(`::debug::${message}`);
}

function info(msg: unknown, ...args: unknown[]): void {
  const message = [msg, ...args].join(' ');
  console.log(`::notice::${message}`);
}

function warn(msg: unknown, ...args: unknown[]): void {
  const message = [msg, ...args].join(' ');
  console.log(`::warning::${message}`);
}

function error(msg: unknown, ...args: unknown[]): void {
  const message = [msg, ...args].join(' ');
  console.log(`::error::${message}`);
}

const log = (m: unknown, ...args: unknown[]): void => debug(m, ...args);

log.debug = (m: unknown, ...args: unknown[]): void => info(m, ...args);
log.info = (m: unknown, ...args: unknown[]): void => info(m, ...args);
log.warn = (m: unknown, ...args: unknown[]): void => warn(m, ...args);
log.error = (m: unknown, ...args: unknown[]): void => error(m, ...args);

export default log;
