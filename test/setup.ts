import * as _core from '@actions/core';
import nock from 'nock';
import { vi } from 'vitest';
import { mocked } from './utils';

vi.mock('@actions/core');
vi.mock('../src/utils/logger');

const core = mocked(_core);

beforeAll(() => {
  nock.disableNetConnect();
  core.getInput.mockReturnValue('');
  core.setOutput = vi.fn();
});

afterAll(() => {
  vi.clearAllMocks();
  nock.enableNetConnect();
});
