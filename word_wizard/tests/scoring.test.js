import { describe, expect, it } from 'vitest';
import { calculateFinalScore, createScoreConfig, scoreAttempt } from '../src/systems/scoring';

describe('N-based scoring', () => {
  it('creates normalized first and second attempt values', () => {
    const config = createScoreConfig(7);
    expect(config.firstAttempt).toBeCloseTo(100 / 7);
    expect(config.secondAttempt).toBeCloseTo(50 / 7);
    expect(scoreAttempt(3, config)).toBe(0);
  });

  it('reaches 100 for all first-attempt answers regardless of N', () => {
    for (const wordCount of [7, 8, 10, 11]) {
      const attempts = Array.from({ length: wordCount }, (_, index) => ({
        word: `word-${index}`,
        correct: true,
        attemptNumber: 1,
      }));
      expect(calculateFinalScore(attempts, wordCount)).toBe(100);
    }
  });

  it('awards half credit for a second-attempt answer', () => {
    expect(calculateFinalScore([
      { word: 'one', correct: true, attemptNumber: 2 },
      { word: 'two', correct: false, attemptNumber: 2 },
    ], 2)).toBe(25);
  });
});
