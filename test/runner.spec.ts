import run from '../src/runner';
import { getName } from './utils';

jest.mock('../src/input.ts');
jest.mock('../src/wayback.ts');

describe(getName(__filename), () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('works', async () => {
    await run();
  });
});
