const SOUND_KEY = 'word-wizard-sound-enabled';
let audioContext = null;
let activeWordAudio = null;

export function isSoundEnabled() {
  return window.localStorage.getItem(SOUND_KEY) !== 'false';
}

export function setSoundEnabled(enabled) {
  window.localStorage.setItem(SOUND_KEY, String(Boolean(enabled)));
}

function getAudioContext() {
  if (!audioContext) {
    const Context = window.AudioContext || window.webkitAudioContext;
    if (!Context) return null;
    audioContext = new Context();
  }
  return audioContext;
}

export function playTone({ frequency = 440, duration = 0.12, type = 'sine' } = {}) {
  if (!isSoundEnabled()) return;
  const context = getAudioContext();
  if (!context) return;
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = type;
  oscillator.frequency.value = frequency;
  gain.gain.setValueAtTime(0.0001, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.08, context.currentTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + duration);
  oscillator.connect(gain).connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + duration + 0.02);
}

function playSequence(notes, type = 'triangle') {
  if (!isSoundEnabled()) return;
  const context = getAudioContext();
  if (!context) return;
  const startTime = context.currentTime;
  notes.forEach(({ frequency, duration, offset }) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const noteStart = startTime + offset;
    const noteEnd = noteStart + duration;
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, noteStart);
    gain.gain.setValueAtTime(0.0001, noteStart);
    gain.gain.exponentialRampToValueAtTime(0.09, noteStart + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, noteEnd);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(noteStart);
    oscillator.stop(noteEnd + 0.02);
  });
}

export function playFeedbackSound(result) {
  if (result === 'correct') {
    playSequence([
      { frequency: 523.25, duration: 0.12, offset: 0 },
      { frequency: 659.25, duration: 0.12, offset: 0.09 },
      { frequency: 783.99, duration: 0.2, offset: 0.18 },
    ], 'triangle');
    return;
  }

  playSequence([
    { frequency: 220, duration: 0.16, offset: 0 },
    { frequency: 146.83, duration: 0.24, offset: 0.12 },
  ], 'sawtooth');
}

export function speakWord(text, { lang = 'en-US' } = {}) {
  if (!isSoundEnabled() || !('speechSynthesis' in window)) return false;
  stopWordAudio();
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  utterance.rate = 0.82;
  utterance.pitch = 1;
  window.speechSynthesis.speak(utterance);
  return true;
}

function stopWordAudio() {
  if (!activeWordAudio) return;
  activeWordAudio.pause();
  activeWordAudio.removeAttribute('src');
  activeWordAudio.load();
  activeWordAudio = null;
}

export function playWordAudio(word) {
  if (!isSoundEnabled()) return false;
  const start = Number(word.audioStart);
  const end = Number(word.audioEnd);
  const hasSegment = Boolean(word.audioUrl) && Number.isFinite(start) && Number.isFinite(end) && end > start;

  if (!hasSegment) return speakWord(word.word);

  stopWordAudio();
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();

  const audio = new Audio(word.audioUrl);
  activeWordAudio = audio;
  audio.preload = 'auto';
  let started = false;
  let completed = false;

  const cleanup = () => {
    audio.removeEventListener('timeupdate', stopAtEnd);
    audio.removeEventListener('error', fallback);
    if (activeWordAudio === audio) activeWordAudio = null;
  };
  const fallback = () => {
    if (completed) return;
    completed = true;
    cleanup();
    speakWord(word.word);
  };
  const stopAtEnd = () => {
    if (audio.currentTime < end) return;
    completed = true;
    audio.pause();
    cleanup();
  };
  const startPlayback = () => {
    if (started || completed) return;
    started = true;
    audio.currentTime = start;
    audio.play().catch(fallback);
  };

  audio.addEventListener('loadedmetadata', startPlayback, { once: true });
  audio.addEventListener('timeupdate', stopAtEnd);
  audio.addEventListener('error', fallback, { once: true });
  audio.load();
  if (audio.readyState >= 1) startPlayback();
  return true;
}
