import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';

export function setOutput(name: string, value: string): void {
  const file = process.env['GITHUB_OUTPUT'];
  if (!file) {
    return;
  }
  const line = value.includes('\n')
    ? buildHeredoc(name, value)
    : `${name}=${value}${os.EOL}`;
  fs.appendFileSync(file, line, { encoding: 'utf8' });
}

function buildHeredoc(name: string, value: string): string {
  const delim = `ghadelim_${crypto.randomUUID()}`;
  return `${name}<<${delim}${os.EOL}${value}${os.EOL}${delim}${os.EOL}`;
}
