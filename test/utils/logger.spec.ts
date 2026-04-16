import { vi } from 'vitest';
import * as core from '@actions/core';
import log from '../../src/utils/logger';

vi.unmock('../../src/utils/logger');

vi.mock('@actions/core', () => ({
  debug: vi.fn(),
  notice: vi.fn(),
  warning: vi.fn(),
  error: vi.fn(),
}));

describe('logger.spec.ts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('routes levels to the correct core functions', () => {
    log('test');
    log.debug('debug msg');
    log.info('info', 'msg');
    log.warn('warn', 'msg');
    log.error('error');

    expect(core.debug).toHaveBeenCalledWith('test');
    expect(core.debug).toHaveBeenCalledWith('debug msg');
    expect(core.notice).toHaveBeenCalledWith('info msg');
    expect(core.warning).toHaveBeenCalledWith('warn msg');
    expect(core.error).toHaveBeenCalledWith('error');
  });

  it('serializes objects to JSON', () => {
    log.info('details:', { status: 'error', message: 'failed' });

    expect(core.notice).toHaveBeenCalledWith(
      'details: {"status":"error","message":"failed"}'
    );
  });

  it('extracts Error messages', () => {
    log.error('caught:', new Error('something broke'));

    expect(core.error).toHaveBeenCalledWith('caught: something broke');
  });
});
