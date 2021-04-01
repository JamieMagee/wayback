import * as _core from '@actions/core';
import nock from 'nock';
import { mocked } from './utils';

jest.mock('@actions/core');
jest.mock('../src/utils/logger');

const core = mocked(_core);

beforeAll(() => {
  nock.disableNetConnect();
  core.getInput.mockReturnValue('');
  core.setOutput = jest.fn();
});

afterAll(() => {
  jest.clearAllMocks();
  nock.enableNetConnect();
});
