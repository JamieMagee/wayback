import fs from 'node:fs';
import { vi } from 'vitest';
import nock from 'nock';
import Input from '../src/input';
import WayBack from '../src/wayback';

vi.mock('../src/input');
vi.mock('node:fs', { spy: true });

const testGuid = 'spn2-b559c7edd3fb67374c1a25e739cdd7edd1d79949';
const testDomain = 'example.com';
const testOutput =
  'https://web.archive.org/web/20220328013741/https://example.com/';

// Read files before mocking fs
const htmlResponse = fs.readFileSync('test/__fixtures__/save.html');
const pendingJson = fs.readFileSync('test/__fixtures__/wayback.pending.json');
const successJson = fs.readFileSync('test/__fixtures__/wayback.success.json');

describe('wayback.spec.ts', () => {
  const waybackScope = nock('https://web.archive.org/save');
  let input: Input;
  beforeEach(() => {
    vi.mocked(fs.appendFileSync).mockClear();
    nock.cleanAll();
    input = new Input();
    // Mock GITHUB_OUTPUT environment variable
    process.env['GITHUB_OUTPUT'] = '/tmp/github_output';
  });

  afterEach(() => {
    nock.abortPendingRequests();
    delete process.env['GITHUB_OUTPUT'];
  });

  it('works', async () => {
    waybackScope
      .post(`/${testDomain}`)
      .reply(200, htmlResponse)
      .get(`/status/${testGuid}`)
      .reply(200, successJson);
    const wayback = new WayBack(input);
    await wayback.save(testDomain);
    expect(vi.mocked(fs.appendFileSync)).toHaveBeenCalledTimes(1);
    expect(vi.mocked(fs.appendFileSync)).toHaveBeenCalledWith(
      '/tmp/github_output',
      `wayback_url=${testOutput}\n`,
      { encoding: 'utf8' }
    );
    expect(nock.isDone()).toBe(true);
  });

  it('polls', async () => {
    waybackScope
      .post(`/${testDomain}`)
      .reply(200, htmlResponse)
      .get(`/status/${testGuid}`)
      .reply(200, pendingJson)
      .get(`/status/${testGuid}`)
      .reply(200, successJson);
    const wayback = new WayBack(input);
    
    // Mock the sleep method to resolve immediately instead of waiting
    vi.spyOn(wayback as any, 'sleep').mockResolvedValue(undefined);
    
    await wayback.save(testDomain);
    expect(vi.mocked(fs.appendFileSync)).toHaveBeenCalledTimes(1);
    expect(vi.mocked(fs.appendFileSync)).toHaveBeenCalledWith(
      '/tmp/github_output',
      `wayback_url=${testOutput}\n`,
      { encoding: 'utf8' }
    );
    expect(nock.isDone()).toBe(true);
  });

  it('submit to throw', async () => {
    waybackScope.post(`/${testDomain}`).reply(500);
    const wayback = new WayBack(input);
    await expect(wayback.save(testDomain)).rejects.toThrow();
    expect(vi.mocked(fs.appendFileSync)).toHaveBeenCalledTimes(0);
  });

  it('to throw', async () => {
    waybackScope
      .post(`/${testDomain}`)
      .reply(200, htmlResponse)
      .get(`/status/${testGuid}`)
      .reply(404);
    const wayback = new WayBack(input);
    await expect(wayback.save(testDomain)).rejects.toThrow();
    expect(vi.mocked(fs.appendFileSync)).toHaveBeenCalledTimes(0);
  });

  it('throws on empty response', async () => {
    waybackScope.post(`/${testDomain}`).reply(200, '');
    const wayback = new WayBack(input);
    await expect(wayback.save(testDomain)).rejects.toThrow();
    expect(vi.mocked(fs.appendFileSync)).toHaveBeenCalledTimes(0);
  });

  it.each([
    ['AdministrativeAccessControlException'],
    ['RobotAccessControlException'],
    ['LiveDocumentNotAvailableException'],
    ['LiveWebCacheUnavailableException'],
    ['Unknown'],
  ])('handles %s header', async (header) => {
    waybackScope.post(`/${testDomain}`).reply(502, undefined, {
      'x-archive-wayback-runtime-error': header,
    });
    const wayback = new WayBack(input);
    await expect(wayback.save(testDomain)).rejects.toThrow();
    expect(vi.mocked(fs.appendFileSync)).toHaveBeenCalledTimes(0);
  });
});
