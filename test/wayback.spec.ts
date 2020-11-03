import fs from 'fs';
import nock from 'nock';
import Input from '../src/input';
import WayBack from '../src/wayback';
import { getName } from './utils';

jest.mock('../src/input');
const testGuid = 'c6721763-2d90-421d-999f-b0d8d9f65b6b';
const testDomain = 'example.com';
const htmlResponse = fs.readFileSync('test/__fixtures__/save.html');
const pendingJson = fs.readFileSync('test/__fixtures__/wayback.pending.json');
const successJson = fs.readFileSync('test/__fixtures__/wayback.success.json');

describe(getName(__filename), () => {
  const waybackScope = nock('https://web.archive.org/save');
  let input: Input;
  beforeEach(() => {
    jest.clearAllMocks();
    nock.cleanAll();
    input = new Input();
  });

  afterEach(() => {
    nock.abortPendingRequests();
  });

  it('works', async () => {
    waybackScope
      .post(`/${testDomain}`)
      .reply(200, htmlResponse)
      .get(`/status/${testGuid}`)
      .reply(200, successJson);
    const wayback = new WayBack(input);
    await wayback.save();
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
    await wayback.save();
    expect(nock.isDone()).toBe(true);
  });

  it('submit to throw', async () => {
    waybackScope.post(`/${testDomain}`).reply(500);
    const wayback = new WayBack(input);
    await expect(wayback.save()).rejects.toThrow();
  });

  it('to throw', async () => {
    waybackScope
      .post(`/${testDomain}`)
      .reply(200, htmlResponse)
      .get(`/status/${testGuid}`)
      .reply(404);
    const wayback = new WayBack(input);
    await expect(wayback.save()).rejects.toThrow();
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
    await expect(wayback.save()).rejects.toThrow();
  });
});
