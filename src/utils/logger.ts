import { error as _error, warning as _warn } from '@actions/core';
import chalk from 'chalk';

function write(prefix: string, ...args: unknown[]): void {
  console.log([`[${prefix}]`, ...args].join(' '));
}

function dir(obj: unknown): void {
  console.dir(obj);
}

function debug(msg: unknown, ...args: unknown[]): void {
  write(chalk.blue('DEBUG'), msg, ...args);
}

function info(msg: unknown, ...args: unknown[]): void {
  write(chalk.green('INFO'), msg, ...args);
}

function warn(msg: unknown, ...args: unknown[]): void {
  write(chalk.yellow('WARN'), msg, ...args);
  _warn([msg, ...args].join(' '));
}

function error(msg: unknown, ...args: unknown[]): void {
  write(chalk.red('ERROR'), msg, ...args);
  _error([msg, ...args].join(' '));
}

const log = (m: unknown, ...args: unknown[]): void => debug(m, ...args);

log.dir = (m: unknown): void => dir(m);
log.debug = (m: unknown, ...args: unknown[]): void => info(m, ...args);
log.info = (m: unknown, ...args: unknown[]): void => info(m, ...args);
log.warn = (m: unknown, ...args: unknown[]): void => warn(m, ...args);
log.error = (m: unknown, ...args: unknown[]): void => error(m, ...args);

export default log;
