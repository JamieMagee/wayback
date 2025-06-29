import { vi } from 'vitest';
import * as _core from '@actions/core';
import log from '../../src/utils/logger';

vi.unmock('../../src/utils/logger');

describe('logger.spec.ts', () => {
  const logger = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    console.log = logger;
  });

  it('works', () => {
    log('test');
    log.info('test', 'it');
    log.warn('test', 'it');
    log.error('test');

    expect(logger.mock.calls).toMatchSnapshot();
  });
});
