import type Input from './input';
import type { SaveResult, SaveStatus } from './types';
import log from './utils/logger';

const DEFAULT_REQUEST_TIMEOUT_MS = 30_000;
const DEFAULT_POLL_INTERVAL_MS = 5_000;
const DEFAULT_POLL_TIMEOUT_MS = 3 * 60_000;

export default class WayBack {
  private static readonly baseWaybackUrl = 'https://web.archive.org/save';
  // The anonymous save endpoint returns the SPN2 HTML progress page. The job
  // id is embedded in a `spn.watchJob("<guid>", ...)` call inside a <script>
  // tag. SPN2 GUIDs look like "spn2-<40 hex>" but older/non-SPN2 flows used
  // other 4-char prefixes, so match any 4 chars from the known alphabet.
  private static readonly statusGuidRegex =
    /watchJob\("(?<guid>[0-9nps]{4}-[0-9a-f]{40})/;
  private readonly input: Input;
  private readonly pollIntervalMs: number;
  private readonly pollTimeoutMs: number;
  private readonly requestTimeoutMs: number;

  constructor(
    input: Input,
    options: {
      pollIntervalMs?: number;
      pollTimeoutMs?: number;
      requestTimeoutMs?: number;
    } = {}
  ) {
    this.input = input;
    this.pollIntervalMs = options.pollIntervalMs ?? DEFAULT_POLL_INTERVAL_MS;
    this.pollTimeoutMs = options.pollTimeoutMs ?? DEFAULT_POLL_TIMEOUT_MS;
    this.requestTimeoutMs =
      options.requestTimeoutMs ?? DEFAULT_REQUEST_TIMEOUT_MS;
  }

  public async save(url: string): Promise<SaveResult> {
    log.info(`Starting archive process for URL: ${url}`);

    const form = new FormData();
    form.append('url', url);

    const captureOptions: string[] = [];
    if (this.input.saveErrors) {
      form.append('capture_all', '1');
      captureOptions.push('errors');
    }
    if (this.input.saveOutlinks) {
      form.append('capture_outlinks', '1');
      captureOptions.push('outlinks');
    }
    if (this.input.saveScreenshot) {
      form.append('capture_screenshot', '1');
      captureOptions.push('screenshot');
    }
    if (this.input.skipFirstArchive) {
      form.append('skip_first_archive', '1');
      captureOptions.push('skip-first-archive');
    }
    if (this.input.ifNotArchivedWithin) {
      form.append('if_not_archived_within', this.input.ifNotArchivedWithin);
      captureOptions.push(
        `if-not-archived-within=${this.input.ifNotArchivedWithin}`
      );
    }

    if (captureOptions.length > 0) {
      log.info(`Capture options enabled: ${captureOptions.join(', ')}`);
    } else {
      log.info('Using default capture options');
    }

    log.info('Sending archive request to Wayback Machine...');
    const res = await this.fetchWithTimeout(WayBack.baseWaybackUrl, {
      method: 'POST',
      body: form,
      headers: this.buildHeaders(),
    });

    if (!res.ok) {
      await this.handleErrorResponse(res);
      throw new Error(
        `Archive request failed with HTTP status ${res.status} for ${url}`
      );
    }

    const jobId = await this.extractJobId(res, url);
    log.info(`Job ID: ${jobId}`);
    log.info('Monitoring archive job status...');
    const saveStatus = await this.pollStatus(jobId);
    return this.interpretStatus(url, saveStatus);
  }

  private async extractJobId(res: Response, url: string): Promise<string> {
    const html = await res.text();
    const match = WayBack.statusGuidRegex.exec(html);
    const guid = match?.groups?.['guid'];
    if (!guid) {
      throw new Error(
        `Unable to extract job ID from Wayback response for ${url}. The URL may have hit the daily capture limit, or the response format may have changed.`
      );
    }
    return guid;
  }

  private buildHeaders(): Record<string, string> {
    // NOTE: do NOT send `Accept: application/json`. Doing so puts SPN2 into its
    // authenticated-API mode and causes a 401 for anonymous requests. Omitting
    // it lets anonymous captures succeed; the status endpoint still returns
    // JSON regardless of the Accept header.
    return {
      'User-Agent': 'https://github.com/JamieMagee/wayback',
    };
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

  private interpretStatus(
    requestedUrl: string,
    saveStatus: SaveStatus
  ): SaveResult {
    log.info(`Archive job completed with status: ${saveStatus.status}`);

    switch (saveStatus.status) {
      case 'success': {
        if (!saveStatus.timestamp || !saveStatus.original_url) {
          throw new Error(
            `Wayback Machine reported success but response is missing timestamp or original_url (job ${saveStatus.job_id}).`
          );
        }
        const archiveUrl = `https://web.archive.org/web/${saveStatus.timestamp}/${saveStatus.original_url}`;
        log.info(`Archive URL: ${archiveUrl}`);
        if (saveStatus.screenshot) {
          log.info(`Screenshot URL: ${saveStatus.screenshot}`);
        }
        const result: SaveResult = {
          url: requestedUrl,
          archiveUrl,
          timestamp: saveStatus.timestamp,
          originalUrl: saveStatus.original_url,
        };
        if (saveStatus.screenshot) {
          result.screenshotUrl = saveStatus.screenshot;
        }
        return result;
      }
      case 'error': {
        const detail = [
          saveStatus.status_ext,
          saveStatus.message,
          saveStatus.exception,
        ]
          .filter(Boolean)
          .join(' | ');
        throw new Error(
          `Wayback Machine failed to archive ${requestedUrl}: ${
            detail || 'no error detail provided'
          }`
        );
      }
      default:
        throw new Error(
          `Unexpected Wayback Machine status '${saveStatus.status}' for ${requestedUrl}.`
        );
    }
  }

  private async pollStatus(guid: string): Promise<SaveStatus> {
    log.debug(`Starting status polling for job: ${guid}`);
    const deadline = Date.now() + this.pollTimeoutMs;
    let pollCount = 0;

    while (true) {
      pollCount++;
      const saveStatus = await this.getSaveStatus(guid);
      if (saveStatus.status !== 'pending') {
        log.info(`Status polling completed after ${pollCount} check(s)`);
        return saveStatus;
      }
      if (Date.now() >= deadline) {
        throw new Error(
          `Timed out after ${Math.round(this.pollTimeoutMs / 1000)}s waiting for Wayback Machine job ${guid} to complete.`
        );
      }
      log.info(`Archive job still in progress... (check ${pollCount})`);
      await this.sleep(this.pollIntervalMs);
    }
  }

  private async getSaveStatus(guid: string): Promise<SaveStatus> {
    log.debug(`Checking status for job: ${guid}`);
    const response = await this.fetchWithTimeout(
      `${WayBack.baseWaybackUrl}/status/${guid}`,
      { headers: this.buildHeaders() }
    );

    if (!response.ok) {
      throw new Error(
        `Status check failed with HTTP status ${response.status} for job ${guid}`
      );
    }

    const status = (await response.json()) as SaveStatus;
    log.debug(`Current job status: ${status.status}`);
    return status;
  }

  private async fetchWithTimeout(
    url: string,
    init: RequestInit
  ): Promise<Response> {
    return fetch(url, {
      ...init,
      signal: AbortSignal.timeout(this.requestTimeoutMs),
    });
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
