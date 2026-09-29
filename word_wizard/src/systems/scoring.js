export function createScoreConfig(wordCount) {
  if (!Number.isInteger(wordCount) || wordCount < 1) {
    throw new Error('wordCount must be a positive integer');
  }

  return {
    wordCount,
    firstAttempt: 100 / wordCount,
    secondAttempt: 50 / wordCount,
  };
}

export function scoreAttempt(attemptNumber, scoreConfig) {
  if (attemptNumber === 1) return scoreConfig.firstAttempt;
  if (attemptNumber === 2) return scoreConfig.secondAttempt;
  return 0;
}

export function roundScore(value) {
  return Math.round(value * 100) / 100;
}

export function calculateFinalScore(attempts, wordCount) {
  const config = createScoreConfig(wordCount);
  const total = attempts.reduce((sum, attempt) => {
    if (!attempt.correct) return sum;
    return sum + scoreAttempt(attempt.attemptNumber, config);
  }, 0);

  return Math.min(100, Math.max(0, Math.round(total)));
}
