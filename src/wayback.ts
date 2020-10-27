import axios from 'axios';
import FormData from 'form-data';
import { SaveStatus } from './types';

export default class WayBack {
  private static readonly baseWaybackUrl = 'https://web.archive.org/save/';
  private static readonly statusGuidRegex = /watchJob\("(?<guid>[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})/;
  private url: string;

  constructor(url: string) {
    this.url = url;
  }

  public async save(): Promise<void> {
    const requestUrl = `${WayBack.baseWaybackUrl}${this.url}`;
    const form = new FormData();
    form.append('url', this.url);
    form.append('capture_all', 'on');

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
        await this.getStatus(guid);
      }
    }
  }

  private async getStatus(guid: string): Promise<void> {
    const status: SaveStatus = (
      await axios.get<SaveStatus>(`${WayBack.baseWaybackUrl}status/${guid}`)
    ).data;
    console.log(status);
  }
}
