import { describe, expect, it } from 'vitest';
import { isAnswerCorrect, normalizeAnswer } from '../src/systems/answer-normalizer';

describe('answer normalizer', () => {
  it('normalizes case, whitespace, punctuation, and dashes', () => {
    expect(normalizeAnswer('  In-FRONT of! ')).toBe('infront of');
  });

  it('accepts a normalized word and configured variants', () => {
    const word = {
      word: 'co-operate',
      normalizedWord: 'cooperate',
      answerVariants: ['co operate'],
    };
    expect(isAnswerCorrect('COOPERATE', word)).toBe(true);
    expect(isAnswerCorrect('co operate', word)).toBe(true);
    expect(isAnswerCorrect('different', word)).toBe(false);
  });
});
