import { describe, expect, it } from 'vitest';
import { createEmptyProgress } from '../src/systems/local-storage';

describe('progress schema', () => {
  it('starts with a versioned empty date map', () => {
    expect(createEmptyProgress()).toEqual({ version: 1, dates: {} });
  });
});
