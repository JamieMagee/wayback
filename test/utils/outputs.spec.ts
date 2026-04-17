import { vi } from 'vitest';
import * as core from '@actions/core';
import { setOutput } from '../../src/utils/outputs';

vi.mock('@actions/core', () => ({
  setOutput: vi.fn(),
}));

describe('outputs.ts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('delegates to core.setOutput', () => {
    setOutput('wayback_url', 'https://example.com/archive');
    expect(core.setOutput).toHaveBeenCalledWith(
      'wayback_url',
      'https://example.com/archive'
    );
  });

  it('passes multiline values through unchanged', () => {
    setOutput('wayback_urls', 'https://a\nhttps://b');
    expect(core.setOutput).toHaveBeenCalledWith(
      'wayback_urls',
      'https://a\nhttps://b'
    );
  });
});
