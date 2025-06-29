import type { MockedObject } from 'vitest';

/**
 * Simple wrapper for getting mocked version of a module
 * @param module module which is mocked by `vi.mock`
 */
export function mocked<T>(module: T): MockedObject<T> {
  return module as never;
}
