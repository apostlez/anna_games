import { calculateFinalScore } from './scoring';

let currentSession = null;

function shuffleWords(words) {
  const shuffled = [...words];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
}

export function startSession({ dateKey, dateLabel, mode, words }) {
  currentSession = {
    dateKey,
    dateLabel,
    mode,
    words: shuffleWords(words),
    currentIndex: 0,
    attempts: [],
    score: 0,
    startedAt: Date.now(),
  };
  return currentSession;
}

export function getSession() {
  return currentSession;
}

export function addAttempt(attempt) {
  if (!currentSession) throw new Error('No active lesson session');
  currentSession.attempts.push(attempt);
  currentSession.score = calculateFinalScore(currentSession.attempts, currentSession.words.length);
  return currentSession;
}

export function finishSession() {
  if (!currentSession) throw new Error('No active lesson session');
  const result = {
    dateKey: currentSession.dateKey,
    dateLabel: currentSession.dateLabel,
    mode: currentSession.mode,
    score: currentSession.score,
    wordCount: currentSession.words.length,
    correctCount: currentSession.attempts.filter((attempt) => attempt.correct).length,
    attempts: [...currentSession.attempts],
    startedAt: currentSession.startedAt,
    finishedAt: Date.now(),
  };
  currentSession = null;
  return result;
}

export function clearSession() {
  currentSession = null;
}
