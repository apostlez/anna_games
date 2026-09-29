import { describe, expect, it } from 'vitest';
import sourceData from '../data/word_source_extraction.json';
import { normalizeAnswer } from '../src/systems/answer-normalizer';

describe('extracted date word data', () => {
  it('contains Day 1 through Day 30 with enough words for choices', () => {
    expect(sourceData.days).toHaveLength(30);
    sourceData.days.forEach((day, index) => {
      expect(day.day).toBe(index + 1);
      expect(day.words.length).toBeGreaterThanOrEqual(3);
    });
  });

  it('contains no duplicate normalized words inside a day', () => {
    sourceData.days.forEach((day) => {
      const normalized = day.words.map(normalizeAnswer);
      expect(new Set(normalized).size).toBe(normalized.length);
    });
  });
});
