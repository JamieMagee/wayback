import * as _core from '@actions/core';
import log from '../../src/utils/logger';
import { getName, mocked } from '../utils';

jest.unmock('../../src/utils/logger');

const core = mocked(_core);

describe(getName(__filename), () => {
  const logger = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    console.log = logger;
    console.dir = logger;
  });

  it('works', () => {
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
