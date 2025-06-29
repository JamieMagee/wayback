import type { MockedObject } from 'vitest';

/**
 * Simple wrapper for getting mocked version of a module
 * @param module module which is mocked by `vi.mock`
 */
export function mocked<T>(module: T): MockedObject<T> {
  return module as never;
}

/**
 * Simply wrapper to create partial mocks.
 * @param obj Object to cast to final type
 */
export function partial<T>(obj?: Partial<T>): T {
  return (obj ?? {}) as T;
}
