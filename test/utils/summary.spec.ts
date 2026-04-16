import fs from 'node:fs';
import { vi } from 'vitest';
import { writeStepSummary } from '../../src/utils/summary';

vi.mock('node:fs', { spy: true });

describe('summary.ts', () => {
  beforeEach(() => {
    vi.mocked(fs.appendFileSync).mockReset();
    process.env['GITHUB_STEP_SUMMARY'] = '/tmp/github_step_summary';
  });

  afterEach(() => {
    delete process.env['GITHUB_STEP_SUMMARY'];
  });

  it('is a no-op when GITHUB_STEP_SUMMARY is unset', () => {
    delete process.env['GITHUB_STEP_SUMMARY'];
    writeStepSummary(
      [
        {
          url: 'example.com',
          archiveUrl: 'https://web.archive.org/web/X/example.com',
          timestamp: 'X',
          originalUrl: 'https://example.com/',
        },
      ],
      []
    );
    expect(vi.mocked(fs.appendFileSync)).not.toHaveBeenCalled();
  });

  it('is a no-op when there are no results or failures', () => {
    writeStepSummary([], []);
    expect(vi.mocked(fs.appendFileSync)).not.toHaveBeenCalled();
  });

  it('writes a success row with archive link', () => {
    writeStepSummary(
      [
        {
          url: 'example.com',
          archiveUrl: 'https://web.archive.org/web/X/example.com',
          timestamp: 'X',
          originalUrl: 'https://example.com/',
        },
      ],
      []
    );
    const call = vi.mocked(fs.appendFileSync).mock.calls[0]!;
    const written = call[1] as string;
    expect(written).toContain('### Wayback Machine captures');
    expect(written).toContain('| URL | Result | Archive |');
    expect(written).toContain('| example.com | ✅ Success |');
    expect(written).toContain(
      '[link](https://web.archive.org/web/X/example.com)'
    );
    expect(written).not.toContain('Screenshot');
  });

  it('includes a screenshot column only when any result has a screenshot', () => {
    writeStepSummary(
      [
        {
          url: 'a.com',
          archiveUrl: 'https://web.archive.org/web/X/a.com',
          screenshotUrl: 'https://web.archive.org/screenshot/a.com',
          timestamp: 'X',
          originalUrl: 'https://a.com/',
        },
        {
          url: 'b.com',
          archiveUrl: 'https://web.archive.org/web/X/b.com',
          timestamp: 'X',
          originalUrl: 'https://b.com/',
        },
      ],
      []
    );
    const written = vi.mocked(fs.appendFileSync).mock.calls[0]![1] as string;
    expect(written).toContain('| URL | Result | Archive | Screenshot |');
    expect(written).toContain(
      '[link](https://web.archive.org/screenshot/a.com)'
    );
  });

  it('renders failure rows with the error message', () => {
    writeStepSummary(
      [],
      [{ url: 'bad.com', error: new Error('status=error: something broke') }]
    );
    const written = vi.mocked(fs.appendFileSync).mock.calls[0]![1] as string;
    expect(written).toContain('| bad.com | ❌ Failed | status=error: something broke |');
  });

  it('escapes pipes and newlines in cell values', () => {
    writeStepSummary(
      [],
      [{ url: 'a|b.com', error: new Error('line1\nline2') }]
    );
    const written = vi.mocked(fs.appendFileSync).mock.calls[0]![1] as string;
    expect(written).toContain('a\\|b.com');
    expect(written).toContain('line1 line2');
  });
});
