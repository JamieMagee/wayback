import Input from './input';
import type { SaveResult } from './types';
import log from './utils/logger';
import { setOutput } from './utils/outputs';
import { type SummaryFailure, writeStepSummary } from './utils/summary';
import WayBack from './wayback';

export default async function run(): Promise<void> {
  let input: Input;
  try {
    input = new Input();
  } catch (error) {
    console.log(`::error::${(error as Error).message}`);
    process.exit(1);
  }

  const wayback = new WayBack(input);
  const results: SaveResult[] = [];
  const failures: SummaryFailure[] = [];

  for (const url of input.url) {
    try {
      results.push(await wayback.save(url));
    } catch (error) {
      const err = error as Error;
      log.error(`Archive process failed for ${url}: ${err.message}`);
      failures.push({ url, error: err });
    }
    if (input.delayBetweenRequests) {
      await Promise.delay(input.delayBetweenRequests);
    }
  }

  writeOutputs(results);
  writeStepSummary(results, failures);

  if (failures.length > 0) {
    const summary = failures
      .map(({ url, error }) => `${url}: ${error.message}`)
      .join('; ');
    console.log(
      `::error::Failed to archive ${failures.length}/${input.url.length} URL(s): ${summary}`
    );
    process.exit(1);
  }
}

function writeOutputs(results: SaveResult[]): void {
  if (results.length === 0) {
    return;
  }

  // Backwards-compat single-value outputs use the last successful capture.
  const last = results[results.length - 1];
  if (!last) {
    return;
  }
  setOutput('wayback_url', last.archiveUrl);
  setOutput('wayback_urls', results.map((r) => r.archiveUrl).join('\n'));

  const screenshots = results
    .map((r) => r.screenshotUrl)
    .filter((u): u is string => typeof u === 'string' && u.length > 0);
  const lastScreenshot = screenshots[screenshots.length - 1];
  if (lastScreenshot) {
    setOutput('screenshot_url', lastScreenshot);
    setOutput('screenshot_urls', screenshots.join('\n'));
  }
}
