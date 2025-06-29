import { vi } from 'vitest';
import Input from '../src/input';

describe('input.spec.ts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear environment variables
    delete process.env['INPUT_URL'];
    delete process.env['INPUT_SAVEERRORS'];
    delete process.env['INPUT_SAVEOUTLINKS'];
    delete process.env['INPUT_SAVESCREENSHOT'];
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

  it('throws', () => {
    process.env['INPUT_URL'] = 'example.com';
    process.env['INPUT_SAVEERRORS'] = 'notaboolean';

    expect(() => {
      new Input();
    }).toThrow();
  });
});
