import fs from 'node:fs';
import os from 'node:os';
import type { SaveResult } from '../types';

export interface SummaryFailure {
  url: string;
  error: Error;
}

export function writeStepSummary(
  results: SaveResult[],
  failures: SummaryFailure[]
): void {
  const file = process.env['GITHUB_STEP_SUMMARY'];
  if (!file) {
    return;
  }
  if (results.length === 0 && failures.length === 0) {
    return;
  }

  const includeScreenshot = results.some(
    (r) => typeof r.screenshotUrl === 'string' && r.screenshotUrl.length > 0
  );

  const headers = ['URL', 'Result', 'Archive'];
  if (includeScreenshot) {
    headers.push('Screenshot');
  }

  const rows: string[] = [];
  rows.push(`| ${headers.join(' | ')} |`);
  rows.push(`| ${headers.map(() => '---').join(' | ')} |`);

  for (const result of results) {
    const cells = [
      escapeCell(result.url),
      '✅ Success',
      `[link](${result.archiveUrl})`,
    ];
    if (includeScreenshot) {
      cells.push(result.screenshotUrl ? `[link](${result.screenshotUrl})` : '');
    }
    rows.push(`| ${cells.join(' | ')} |`);
  }

  for (const failure of failures) {
    const cells = [
      escapeCell(failure.url),
      '❌ Failed',
      escapeCell(failure.error.message),
    ];
    if (includeScreenshot) {
      cells.push('');
    }
    rows.push(`| ${cells.join(' | ')} |`);
  }

  const body = ['### Wayback Machine captures', '', rows.join(os.EOL), ''].join(
    os.EOL
  );

  fs.appendFileSync(file, body + os.EOL, { encoding: 'utf8' });
}

function escapeCell(value: string): string {
  return value.replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
}
