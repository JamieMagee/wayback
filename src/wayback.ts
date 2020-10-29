import axios from 'axios';
import FormData from 'form-data';
import { SaveStatus } from './types';
import log from './utils/logger';

export default class WayBack {
  private static readonly baseWaybackUrl = 'https://web.archive.org/save';
  private static readonly statusGuidRegex = /watchJob\("(?<guid>[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})/;
  private url: string;

  constructor(url: string) {
    this.url = url;
  }

  public async save(): Promise<void> {
    const requestUrl = `${WayBack.baseWaybackUrl}/${this.url}`;
    const form = new FormData();
    form.append('url', this.url);
    form.append('capture_all', 'on');
    // form.append('capture_outlinks', 'on');
    // form.append('capture_screenshot', 'on');

    try {
      const res = await axios.post(requestUrl, form, {
        headers: {
          'User-Agent': 'https://github.com/JamieMagee/wayback',
          ...form.getHeaders(),
        },
      });
      const match = WayBack.statusGuidRegex.exec(res.data);
      if (match) {
        const guid = match.groups?.guid;
        if (guid) {
          const saveStatus = await this.pollStatus(guid);
          this.handleResponse(saveStatus);
        } else {
          log.error(`Unable to fetch status for ${this.url}`);
        }
      } else {
        log.error(`Unable to fetch status for ${this.url}`);
      }
    } catch (err) {
      log.error((err as Error).message);
      throw err;
    }
  }

  private handleResponse(saveStatus: SaveStatus): void {
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
    if (!(saveStatus.status === 'success')) {
      return undefined;
    }
    // original_url is present when status === 'success'
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    return `https://web.archive.org/web/${saveStatus.timestamp}/${saveStatus.original_url}`;
  }
}
