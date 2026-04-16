import fs from 'node:fs';
import os from 'node:os';
import { vi } from 'vitest';
import { setOutput } from '../../src/utils/outputs';

vi.mock('node:fs', { spy: true });

describe('outputs.ts', () => {
  beforeEach(() => {
    vi.mocked(fs.appendFileSync).mockReset();
    process.env['GITHUB_OUTPUT'] = '/tmp/github_output';
  });

  afterEach(() => {
    delete process.env['GITHUB_OUTPUT'];
  });

  it('writes a simple key=value line for single-line values', () => {
    setOutput('wayback_url', 'https://example.com/archive');
    expect(vi.mocked(fs.appendFileSync)).toHaveBeenCalledWith(
      '/tmp/github_output',
      `wayback_url=https://example.com/archive${os.EOL}`,
      { encoding: 'utf8' }
    );
  });

  it('uses heredoc format for multiline values', () => {
    setOutput('wayback_urls', 'https://a\nhttps://b');
    const call = vi.mocked(fs.appendFileSync).mock.calls[0]!;
    const written = call[1] as string;
    expect(written).toMatch(/^wayback_urls<<ghadelim_[0-9a-f-]+/);
    expect(written).toContain('https://a\nhttps://b');
  });

  it('is a no-op when GITHUB_OUTPUT is unset', () => {
    delete process.env['GITHUB_OUTPUT'];
    setOutput('wayback_url', 'x');
    expect(vi.mocked(fs.appendFileSync)).not.toHaveBeenCalled();
  });
});
