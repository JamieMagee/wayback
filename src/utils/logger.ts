import * as core from '@actions/core';

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

const log = (m: unknown, ...args: unknown[]): void =>
  core.debug(formatMessage(m, ...args));

log.debug = (m: unknown, ...args: unknown[]): void =>
  core.debug(formatMessage(m, ...args));
log.info = (m: unknown, ...args: unknown[]): void =>
  core.notice(formatMessage(m, ...args));
log.warn = (m: unknown, ...args: unknown[]): void =>
  core.warning(formatMessage(m, ...args));
log.error = (m: unknown, ...args: unknown[]): void =>
  core.error(formatMessage(m, ...args));

export default log;
