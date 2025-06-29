import { vi } from 'vitest';
import * as _core from '@actions/core';
import log from '../../src/utils/logger';
import { mocked } from '../utils';

vi.unmock('../../src/utils/logger');

const core = mocked(_core);

describe('logger.spec.ts', () => {
  const logger = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    console.log = logger;
    console.dir = logger;
  });

  it.skip('works', () => {
    log('test');
    log.dir({ name: 'test', code: 1 });
    log.info('test', 'it');
    log.warn('test', 'it');
    log.error('test');

    expect(logger.mock.calls).toMatchSnapshot();
    expect(core.warning).toHaveBeenCalledWith('test it');
    expect(core.error).toHaveBeenCalledWith('test');
  });
});
