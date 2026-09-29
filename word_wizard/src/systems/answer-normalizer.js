const punctuationPattern = /[.,!?;:()[\]{}\"]+/g;
const dashPattern = /[‐‑‒–—-]/g;

export function normalizeAnswer(value) {
  return String(value ?? '')
    .normalize('NFKC')
    .toLowerCase()
    .trim()
    .replace(/[’]/g, "'")
    .replace(dashPattern, '')
    .replace(punctuationPattern, '')
    .replace(/\s+/g, ' ');
}

export function isAnswerCorrect(input, word) {
  const normalizedInput = normalizeAnswer(input);
  const accepted = [word.normalizedWord || word.word, ...(word.answerVariants || [])]
    .map(normalizeAnswer)
    .filter(Boolean);

  return normalizedInput.length > 0 && accepted.includes(normalizedInput);
}
