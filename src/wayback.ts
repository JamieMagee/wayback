import * as core from '@actions/core';
import axios, { AxiosResponse } from 'axios';
import FormData from 'form-data';
import Input from './input';
import { SaveStatus } from './types';
import log from './utils/logger';

export default class WayBack {
  private static readonly baseWaybackUrl = 'https://web.archive.org/save';
  private static readonly statusGuidRegex =
    /watchJob\("(?<guid>[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})/;
  private url: string;
  private saveErrors: boolean;
  private saveOutlinks: boolean;
  private saveScreenshot: boolean;

  constructor(input: Input) {
    this.url = input.url;
    this.saveErrors = input.saveErrors;
    this.saveOutlinks = input.saveOutlinks;
    this.saveScreenshot = input.saveScreenshot;
  }

  public async save(): Promise<void> {
    const requestUrl = `${WayBack.baseWaybackUrl}/${this.url}`;
    const form = new FormData();
    form.append('url', this.url);
    if (this.saveErrors) {
      form.append('capture_all', 'on');
    }
    if (this.saveOutlinks) {
      form.append('capture_outlinks', 'on');
    }
    if (this.saveScreenshot) {
      form.append('capture_screenshot', 'on');
    }

    try {
      const res = await axios.post(requestUrl, form, {
        headers: {
          'User-Agent': 'https://github.com/JamieMagee/wayback',
          ...form.getHeaders(),
        },
      });
      const match = WayBack.statusGuidRegex.exec(res.data);
      if (match && match.groups?.guid) {
        const guid = match.groups?.guid;
        const saveStatus = await this.pollStatus(guid);
        this.handleStatusResponse(saveStatus);
      } else {
        log.error('Unable to fetch status');
        throw new Error();
      }
    } catch (err) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      this.handleErrorResponse(err.response as AxiosResponse);
      log.error((err as Error).message);
      throw err;
    }
  }

  private handleErrorResponse(response: AxiosResponse): void {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const error: string = // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      response?.headers?.['x-archive-wayback-runtime-error'];
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
    switch (saveStatus.status) {
      case 'success':
        log.info(this.getArchiveUrl(saveStatus));
        break;
      default:
        log.debug(saveStatus);
    }
  }

  private async pollStatus(guid: string): Promise<SaveStatus> {
    let saveStatus = await this.getSaveStatus(guid);
    while (saveStatus.status === 'pending') {
      await this.sleep(2000);
      saveStatus = await this.getSaveStatus(guid);
    }
    return saveStatus;
  }

  private async getSaveStatus(guid: string): Promise<SaveStatus> {
    try {
      return (
        await axios.get<SaveStatus>(`${WayBack.baseWaybackUrl}/status/${guid}`)
      ).data;
    } catch (err) {
      log.error((err as Error).message);
      throw err;
    }
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private getArchiveUrl(saveStatus: SaveStatus): string | undefined {
    // original_url is present when status === 'success'
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    const archiveUrl = `https://web.archive.org/web/${saveStatus.timestamp}/${saveStatus.original_url}`;
    core.setOutput('wayback_url', archiveUrl);
    return archiveUrl;
  }
}
