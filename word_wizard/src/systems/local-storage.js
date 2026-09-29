const STORAGE_KEY = 'word-wizard-progress-v1';
const STORAGE_VERSION = 1;
const MODES = ['speak', 'write', 'flight'];

function emptyModeProgress() {
  return {
    completed: false,
    score: 0,
    correctCount: 0,
    wordCount: 0,
    completedAt: null,
  };
}

function emptyDateProgress() {
  return {
    speak: emptyModeProgress(),
    write: emptyModeProgress(),
    flight: emptyModeProgress(),
    completed: false,
    completedAt: null,
  };
}

export function createEmptyProgress() {
  return {
    version: STORAGE_VERSION,
    dates: {},
  };
}

function isValidProgress(value) {
  return Boolean(value && value.version === STORAGE_VERSION && value.dates && typeof value.dates === 'object');
}

function readProgress() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return createEmptyProgress();
    const parsed = JSON.parse(raw);
    return isValidProgress(parsed) ? parsed : createEmptyProgress();
  } catch {
    return createEmptyProgress();
  }
}

function writeProgress(progress) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // Private browsing or a disabled storage area should not stop a lesson.
  }
}

function getOrCreateDate(progress, dateKey) {
  if (!progress.dates[dateKey]) {
    progress.dates[dateKey] = emptyDateProgress();
  }
  return progress.dates[dateKey];
}

export function getDateProgress(dateKey) {
  const progress = readProgress();
  return progress.dates[dateKey] || emptyDateProgress();
}

export function getAllProgress() {
  return readProgress();
}

export function saveGameResult(dateKey, mode, result) {
  if (!MODES.includes(mode)) throw new Error(`Unknown game mode: ${mode}`);

  const progress = readProgress();
  const dateProgress = getOrCreateDate(progress, dateKey);
  dateProgress[mode] = {
    completed: true,
    score: result.score,
    correctCount: result.correctCount,
    wordCount: result.wordCount,
    completedAt: new Date().toISOString(),
  };

  const allComplete = MODES.every((entry) => dateProgress[entry].completed);
  dateProgress.completed = allComplete;
  dateProgress.completedAt = allComplete
    ? dateProgress.completedAt || new Date().toISOString()
    : null;
  writeProgress(progress);
  return dateProgress;
}

export function getStorageKey() {
  return STORAGE_KEY;
}
