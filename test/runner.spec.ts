import { vi } from 'vitest';
import run from '../src/runner';

vi.mock('../src/input.ts');
vi.mock('../src/wayback.ts');

describe('runner.spec.ts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('works', async () => {
    await run();
  });
});
