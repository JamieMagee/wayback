import fs from 'node:fs';
import nock from 'nock';
import { vi } from 'vitest';
import Input from '../src/input';
import WayBack from '../src/wayback';

vi.mock('../src/input');

const testGuid = 'spn2-b559c7edd3fb67374c1a25e739cdd7edd1d79949';
const testDomain = 'example.com';
const testArchiveUrl =
  'https://web.archive.org/web/20220328013741/https://example.com/';

const htmlResponse = fs.readFileSync('test/__fixtures__/save.html');

const successBody = {
  job_id: testGuid,
  resources: [],
  timestamp: '20220328013741',
  original_url: 'https://example.com/',
  status: 'success',
  duration_sec: 4.121,
};

const pendingBody = {
  job_id: testGuid,
  resources: [],
  status: 'pending',
};

describe('wayback.spec.ts', () => {
  const waybackScope = nock('https://web.archive.org');
  let input: Input;
  beforeEach(() => {
    nock.cleanAll();
    input = new Input();
  });

  afterEach(() => {
    nock.abortPendingRequests();
  });

  function makeWayback(): WayBack {
    return new WayBack(input, {
      pollIntervalMs: 0,
      pollTimeoutMs: 60_000,
      requestTimeoutMs: 5_000,
    });
  }

  describe('save', () => {
    it('scrapes job id from the HTML response and returns the archive URL', async () => {
      waybackScope
        .post('/save', (body) => body.includes(testDomain))
        .reply(200, htmlResponse)
        .get(`/save/status/${testGuid}`)
        .reply(200, successBody);
      const wayback = makeWayback();
      const result = await wayback.save(testDomain);
      expect(result.archiveUrl).toBe(testArchiveUrl);
      expect(nock.isDone()).toBe(true);
    });

    it('does not send Accept: application/json or Authorization headers', async () => {
      const forbiddenAccept = vi.fn();
      const forbiddenAuth = vi.fn();
      waybackScope
        .post('/save')
        .reply(function () {
          if (this.req.headers['accept'] === 'application/json') {
            forbiddenAccept();
          }
          if (this.req.headers['authorization']) {
            forbiddenAuth();
          }
          return [200, htmlResponse];
        })
        .get(`/save/status/${testGuid}`)
        .reply(200, successBody);
      const wayback = makeWayback();
      await wayback.save(testDomain);
      expect(forbiddenAccept).not.toHaveBeenCalled();
      expect(forbiddenAuth).not.toHaveBeenCalled();
    });

    it('throws a clear error when the HTML response has no job id', async () => {
      waybackScope.post('/save').reply(200, '<html>rate limited</html>');
      const wayback = makeWayback();
      await expect(wayback.save(testDomain)).rejects.toThrow(/job ID/);
    });

    it('polls until the job completes', async () => {
      waybackScope
        .post('/save')
        .reply(200, htmlResponse)
        .get(`/save/status/${testGuid}`)
        .reply(200, pendingBody)
        .get(`/save/status/${testGuid}`)
        .reply(200, successBody);
      const wayback = makeWayback();
      const result = await wayback.save(testDomain);
      expect(result.archiveUrl).toBe(testArchiveUrl);
      expect(nock.isDone()).toBe(true);
    });
  });

  it('sends skip_first_archive and if_not_archived_within when configured', async () => {
    input = Object.assign(new Input(), {
      skipFirstArchive: true,
      ifNotArchivedWithin: '1d',
    });
    waybackScope
      .post(
        '/save',
        (body) =>
          body.includes('skip_first_archive') &&
          body.includes('if_not_archived_within') &&
          body.includes('1d')
      )
      .reply(200, htmlResponse)
      .get(`/save/status/${testGuid}`)
      .reply(200, successBody);
    const wayback = makeWayback();
    await wayback.save(testDomain);
    expect(nock.isDone()).toBe(true);
  });

  it('throws when the status endpoint reports an error', async () => {
    waybackScope
      .post('/save')
      .reply(200, htmlResponse)
      .get(`/save/status/${testGuid}`)
      .reply(200, {
        job_id: testGuid,
        status: 'error',
        status_ext: 'error:invalid-host-resolution',
        message: "Couldn't resolve host for http://example5123.com.",
      });
    const wayback = makeWayback();
    await expect(wayback.save(testDomain)).rejects.toThrow(
      /invalid-host-resolution/
    );
  });

  it('throws on HTTP failure from the capture endpoint', async () => {
    waybackScope.post('/save').reply(500);
    const wayback = makeWayback();
    await expect(wayback.save(testDomain)).rejects.toThrow();
  });

  it('throws on HTTP failure from the status endpoint', async () => {
    waybackScope
      .post('/save')
      .reply(200, htmlResponse)
      .get(`/save/status/${testGuid}`)
      .reply(404);
    const wayback = makeWayback();
    await expect(wayback.save(testDomain)).rejects.toThrow();
  });

  it('times out if polling never completes', async () => {
    waybackScope
      .post('/save')
      .reply(200, htmlResponse)
      .get(`/save/status/${testGuid}`)
      .times(10)
      .reply(200, pendingBody);
    const wayback = new WayBack(input, {
      pollIntervalMs: 0,
      pollTimeoutMs: 0,
      requestTimeoutMs: 5_000,
    });
    await expect(wayback.save(testDomain)).rejects.toThrow(/Timed out/);
  });

  it.each([
    ['AdministrativeAccessControlException'],
    ['RobotAccessControlException'],
    ['LiveDocumentNotAvailableException'],
    ['LiveWebCacheUnavailableException'],
    ['Unknown'],
  ])('handles %s header', async (header) => {
    waybackScope.post('/save').reply(502, undefined, {
      'x-archive-wayback-runtime-error': header,
    });
    const wayback = makeWayback();
    await expect(wayback.save(testDomain)).rejects.toThrow();
  });

  it('exposes screenshot URL when present', async () => {
    waybackScope
      .post('/save')
      .reply(200, htmlResponse)
      .get(`/save/status/${testGuid}`)
      .reply(200, {
        ...successBody,
        screenshot: 'http://web.archive.org/screenshot/https://example.com/',
      });
    const wayback = makeWayback();
    const result = await wayback.save(testDomain);
    expect(result.screenshotUrl).toBe(
      'http://web.archive.org/screenshot/https://example.com/'
    );
  });
});
