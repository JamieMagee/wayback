import nock from 'nock';
import WayBack from '../src/wayback';
import { getName } from './utils';

describe(getName(__filename), () => {
  beforeEach(() => {
    jest.clearAllMocks();
    nock.cleanAll;
  });

  afterEach(() => {
    nock.abortPendingRequests();
  });

  it('works', async () => {
    nock('https://web.archive.org/save').post('/example.com').reply(200);
    const wayback = new WayBack('example.com');
    await wayback.save();
    expect(nock.isDone()).toBe(true);
  });
});
