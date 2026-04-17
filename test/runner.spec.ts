import { vi } from 'vitest';
import * as core from '@actions/core';
import run from '../src/runner';
import WayBack from '../src/wayback';

vi.mock('@actions/core', () => ({
  setFailed: vi.fn(),
  setOutput: vi.fn(),
  debug: vi.fn(),
  notice: vi.fn(),
  warning: vi.fn(),
  error: vi.fn(),
}));
vi.mock('../src/input.ts');
vi.mock('../src/wayback.ts');
vi.mock('../src/utils/summary.ts', () => ({ writeStepSummary: vi.fn() }));

import { writeStepSummary } from '../src/utils/summary';

describe('runner.spec.ts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('writes outputs and exits successfully when all URLs archive', async () => {
    const save = vi.fn().mockResolvedValue({
      url: 'example.com',
      archiveUrl: 'https://web.archive.org/web/X/example.com',
      timestamp: 'X',
      originalUrl: 'https://example.com/',
    });
    vi.mocked(WayBack).mockImplementation(
      function () {
        return { save } as unknown as WayBack;
      } as unknown as typeof WayBack
    );

    await run();

    expect(save).toHaveBeenCalledWith('example.com');
    expect(vi.mocked(core.setOutput)).toHaveBeenCalledWith(
      'wayback_url',
      'https://web.archive.org/web/X/example.com'
    );
    expect(core.setFailed).not.toHaveBeenCalled();

  });

  it('passes results and failures to the step summary', async () => {
    const save = vi.fn().mockResolvedValue({
      url: 'example.com',
      archiveUrl: 'https://web.archive.org/web/X/example.com',
      timestamp: 'X',
      originalUrl: 'https://example.com/',
    });
    vi.mocked(WayBack).mockImplementation(
      function () {
        return { save } as unknown as WayBack;
      } as unknown as typeof WayBack
    );

    await run();

    expect(vi.mocked(writeStepSummary)).toHaveBeenCalledTimes(1);
    const [results, failures] = vi.mocked(writeStepSummary).mock.calls[0]!;
    expect(results).toHaveLength(1);
    expect(failures).toHaveLength(0);
  });

  it('continues after a per-URL failure and calls setFailed at the end', async () => {
    const save = vi.fn().mockRejectedValue(new Error('boom'));
    vi.mocked(WayBack).mockImplementation(
      function () {
        return { save } as unknown as WayBack;
      } as unknown as typeof WayBack
    );

    await run();
    expect(core.setFailed).toHaveBeenCalledWith(
      expect.stringContaining('Failed to archive')
    );
    expect(vi.mocked(core.setOutput)).not.toHaveBeenCalled();
  });

  it('emits screenshot outputs when available', async () => {
    const save = vi.fn().mockResolvedValue({
      url: 'example.com',
      archiveUrl: 'https://web.archive.org/web/X/example.com',
      screenshotUrl: 'http://web.archive.org/screenshot/example.com',
      timestamp: 'X',
      originalUrl: 'https://example.com/',
    });
    vi.mocked(WayBack).mockImplementation(
      function () {
        return { save } as unknown as WayBack;
      } as unknown as typeof WayBack
    );

    await run();

    expect(vi.mocked(core.setOutput)).toHaveBeenCalledWith(
      'screenshot_url',
      'http://web.archive.org/screenshot/example.com'
    );
  });
});
