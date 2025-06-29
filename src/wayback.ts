import fs from 'node:fs';
import os from 'node:os';
import type Input from './input';
import type { SaveStatus } from './types';
import log from './utils/logger';

export default class WayBack {
  private static readonly baseWaybackUrl = 'https://web.archive.org/save';
  private static readonly statusGuidRegex =
    /watchJob\("(?<guid>[0-9nps]{4}-[0-9a-f]{40})/;
  private saveErrors: boolean;
  private saveOutlinks: boolean;
  private saveScreenshot: boolean;

  constructor(input: Input) {
    this.saveErrors = input.saveErrors;
    this.saveOutlinks = input.saveOutlinks;
    this.saveScreenshot = input.saveScreenshot;
  }

  public async save(url: string): Promise<void> {
    log.info(`Starting archive process for URL: ${url}`);

    const requestUrl = `${WayBack.baseWaybackUrl}/${url}`;
    const form = new FormData();
    form.append('url', url);

    // Log the capture options being used
    const captureOptions: string[] = [];
    if (this.saveErrors) {
      form.append('capture_all', 'on');
      captureOptions.push('errors');
    }
    if (this.saveOutlinks) {
      form.append('capture_outlinks', 'on');
      captureOptions.push('outlinks');
    }
    if (this.saveScreenshot) {
      form.append('capture_screenshot', 'on');
      captureOptions.push('screenshot');
    }

    if (captureOptions.length > 0) {
      log.info(`Capture options enabled: ${captureOptions.join(', ')}`);
    } else {
      log.info('Using default capture options');
    }

    try {
      log.info('Sending archive request to Wayback Machine...');
      const res = await fetch(requestUrl, {
        method: 'POST',
        body: form,
        headers: {
          'User-Agent': 'https://github.com/JamieMagee/wayback',
        },
      });

      if (!res.ok) {
        log.error(`Archive request failed with status: ${res.status}`);
        await this.handleErrorResponse(res);
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      log.info('Archive request submitted successfully, extracting job ID...');
      const responseText = await res.text();
      const match = WayBack.statusGuidRegex.exec(responseText);
      if (match?.groups?.['guid']) {
        const guid = match.groups?.['guid'];
        log.info(`Job ID extracted: ${guid}`);
        log.info('Monitoring archive job status...');
        const saveStatus = await this.pollStatus(guid);
        this.handleStatusResponse(saveStatus);
      } else {
        log.error('Unable to extract job ID from response');
        throw new Error('Unable to fetch status');
      }
    } catch (err) {
      if (err instanceof Error) {
        log.error(`Archive process failed: ${err.message}`);
      }
      throw err;
    }
  }

  private async handleErrorResponse(response: Response): Promise<void> {
    const error: string | undefined =
      response.headers.get('x-archive-wayback-runtime-error') ?? undefined;
    if (error) {
      switch (error) {
        case 'AdministrativeAccessControlException':
          log.error('This site is excluded from the Wayback Machine.');
          break;
        case 'RobotAccessControlException':
          log.error('Blocked by robots.txt.');
          break;
        case 'LiveDocumentNotAvailableException':
        case 'LiveWebCacheUnavailableException':
          log.error('Unable to archive page. Try again later.');
          break;
        default:
          log.error('An unknown error occurred.', error);
      }
    }
  }

  private handleStatusResponse(saveStatus: SaveStatus): void {
    log.info(`Archive job completed with status: ${saveStatus.status}`);

    switch (saveStatus.status) {
      case 'success': {
        log.info('Archive successfully created!');
        const archiveUrl = this.getArchiveUrl(saveStatus);
        log.info(`Archive URL: ${archiveUrl}`);
        break;
      }
      case 'error':
        log.error('Archive job failed with an error');
        log.debug('Full error details:', saveStatus);
        break;
      default:
        log.warn(`Unexpected archive status: ${saveStatus.status}`);
        log.debug('Full status details:', saveStatus);
    }
  }

  private async pollStatus(guid: string): Promise<SaveStatus> {
    log.debug(`Starting status polling for job: ${guid}`);
    let saveStatus = await this.getSaveStatus(guid);
    let pollCount = 1;

    while (saveStatus.status === 'pending') {
      log.info(`Archive job still in progress... (check ${pollCount})`);
      await this.sleep(2000);
      saveStatus = await this.getSaveStatus(guid);
      pollCount++;
    }

    log.info(`Status polling completed after ${pollCount} check(s)`);
    return saveStatus;
  }

  private async getSaveStatus(guid: string): Promise<SaveStatus> {
    try {
      log.debug(`Checking status for job: ${guid}`);
      const response = await fetch(`${WayBack.baseWaybackUrl}/status/${guid}`);

      if (!response.ok) {
        log.error(`Status check failed with HTTP status: ${response.status}`);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const status = (await response.json()) as SaveStatus;
      log.debug(`Current job status: ${status.status}`);
      return status;
    } catch (err) {
      if (err instanceof Error) {
        log.error(`Failed to get save status: ${err.message}`);
      }
      throw err;
    }
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private getArchiveUrl(saveStatus: SaveStatus): string | undefined {
    // original_url is present when status === 'success'
    const archiveUrl = `https://web.archive.org/web/${saveStatus.timestamp}/${saveStatus.original_url}`;

    // Set output using workflow command equivalent
    const githubOutput = process.env['GITHUB_OUTPUT'];
    if (githubOutput) {
      log.debug('Setting GitHub Actions output variable');
      fs.appendFileSync(githubOutput, `wayback_url=${archiveUrl}${os.EOL}`, {
        encoding: 'utf8',
      });
      log.debug('GitHub Actions output variable set successfully');
    }

    return archiveUrl;
  }
}
