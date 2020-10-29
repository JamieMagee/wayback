import fs from 'fs';
import nock from 'nock';
import WayBack from '../src/wayback';
import { getName } from './utils';

const testGuid = 'c6721763-2d90-421d-999f-b0d8d9f65b6b';
const htmlResponse = fs.readFileSync('test/__fixtures__/save.html');
const pendingJson = fs.readFileSync('test/__fixtures__/wayback.pending.json');
const successJson = fs.readFileSync('test/__fixtures__/wayback.success.json');

describe(getName(__filename), () => {
  const waybackScope = nock('https://web.archive.org/save');
  beforeEach(() => {
    jest.clearAllMocks();
    nock.cleanAll();
  });

  afterEach(() => {
    nock.abortPendingRequests();
  });

  it('works', async () => {
    waybackScope
      .post('/example.com')
      .reply(200, htmlResponse)
      .get(`/status/${testGuid}`)
      .reply(200, successJson);
    const wayback = new WayBack('example.com');
    await wayback.save();
    expect(nock.isDone()).toBe(true);
  });

  it('polls', async () => {
    waybackScope
      .post('/example.com')
      .reply(200, htmlResponse)
      .get(`/status/${testGuid}`)
      .reply(200, pendingJson)
      .get(`/status/${testGuid}`)
      .reply(200, successJson);
    const wayback = new WayBack('example.com');
    await wayback.save();
    expect(nock.isDone()).toBe(true);
  });

  it('submit to throw', async () => {
    waybackScope.post('/example.com').reply(500);
    const wayback = new WayBack('example.com');
    await expect(wayback.save()).rejects.toThrow();
  });

  it('to throw', async () => {
    waybackScope
      .post('/example.com')
      .reply(200, htmlResponse)
      .get(`/status/${testGuid}`)
      .reply(404);
    const wayback = new WayBack('example.com');
    await expect(wayback.save()).rejects.toThrow();
  });
});
