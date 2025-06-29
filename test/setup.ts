import nock from 'nock';
import { vi } from 'vitest';

vi.mock('../src/utils/logger');

beforeAll(() => {
  nock.disableNetConnect();
});

afterAll(() => {
  vi.clearAllMocks();
  nock.enableNetConnect();
});
