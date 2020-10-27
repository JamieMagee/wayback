import * as _runner from '../src/runner';
import { getName, mocked } from './utils';

jest.mock('../src/runner');

const runner = mocked(_runner);

describe(getName(__filename), () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('works', async () => {
    runner.default.mockResolvedValueOnce();
    await import('../src');
    expect(runner.default).toHaveBeenCalled();
  });
});
