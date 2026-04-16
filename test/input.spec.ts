import fs from 'node:fs';
import { vi } from 'vitest';
import Input from '../src/input';

vi.mock('node:fs', { spy: true });

describe('input.spec.ts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear environment variables
    delete process.env['INPUT_URL'];
    delete process.env['INPUT_SAVEERRORS'];
    delete process.env['INPUT_SAVEOUTLINKS'];
    delete process.env['INPUT_SAVESCREENSHOT'];
    delete process.env['GITHUB_WORKSPACE'];
  });

  it('works for multiple urls', () => {
    process.env['INPUT_URL'] = 'example.com\nexample.com';
    process.env['INPUT_SAVEERRORS'] = 'true';
    process.env['INPUT_SAVEOUTLINKS'] = 'false';
    process.env['INPUT_SAVESCREENSHOT'] = 'true';

    const input = new Input();

    expect(input.url).toEqual(['example.com', 'example.com']);
    expect(input.saveErrors).toBe(true);
    expect(input.saveOutlinks).toBe(false);
    expect(input.saveScreenshot).toBe(true);
  });

  it('works for a single url', () => {
    process.env['INPUT_URL'] = 'example.com';
    process.env['INPUT_SAVEERRORS'] = 'true';
    process.env['INPUT_SAVEOUTLINKS'] = 'false';
    process.env['INPUT_SAVESCREENSHOT'] = 'true';

    const input = new Input();

    expect(input.url).toEqual(['example.com']);
    expect(input.saveErrors).toBe(true);
    expect(input.saveOutlinks).toBe(false);
    expect(input.saveScreenshot).toBe(true);
  });

  it('throws on invalid boolean', () => {
    process.env['INPUT_URL'] = 'example.com';
    process.env['INPUT_SAVEERRORS'] = 'notaboolean';

    expect(() => {
      new Input();
    }).toThrow();
  });

  it('detects URL from CNAME file', () => {
    process.env['INPUT_SAVEERRORS'] = 'true';
    process.env['INPUT_SAVEOUTLINKS'] = 'false';
    process.env['INPUT_SAVESCREENSHOT'] = 'false';
    process.env['GITHUB_WORKSPACE'] = '/tmp/test-repo';

    vi.mocked(fs.readFileSync).mockReturnValue('example.org\n');

    const input = new Input();

    expect(input.url).toEqual(['example.org']);
    expect(vi.mocked(fs.readFileSync)).toHaveBeenCalledWith(
      '/tmp/test-repo/CNAME',
      'utf8'
    );
  });

  it('throws when no URL and no CNAME file', () => {
    process.env['INPUT_SAVEERRORS'] = 'true';
    process.env['INPUT_SAVEOUTLINKS'] = 'false';
    process.env['INPUT_SAVESCREENSHOT'] = 'false';

    vi.mocked(fs.readFileSync).mockImplementation(() => {
      throw new Error('ENOENT');
    });

    expect(() => {
      new Input();
    }).toThrow('No URL provided and no CNAME file found');
  });

  it('prefers explicit URL over CNAME file', () => {
    process.env['INPUT_URL'] = 'explicit.com';
    process.env['INPUT_SAVEERRORS'] = 'true';
    process.env['INPUT_SAVEOUTLINKS'] = 'false';
    process.env['INPUT_SAVESCREENSHOT'] = 'false';
    process.env['GITHUB_WORKSPACE'] = '/tmp/test-repo';

    const input = new Input();

    expect(input.url).toEqual(['explicit.com']);
  });
});
