import { readFile } from 'node:fs/promises';

const sourcePath = new URL('../data/word_source_extraction.json', import.meta.url);
const source = JSON.parse(await readFile(sourcePath, 'utf8'));
const meaningPath = new URL('../data/word_meanings.json', import.meta.url);
const meaningData = JSON.parse(await readFile(meaningPath, 'utf8'));
const failures = [];

if (!Array.isArray(source.days) || source.days.length !== 30) {
  failures.push('Expected exactly 30 day entries.');
}

const normalize = (value) => String(value ?? '')
  .normalize('NFKC')
  .toLowerCase()
  .trim()
  .replace(/[‐‑‒–—-]/g, '')
  .replace(/\s+/g, ' ');

for (const [index, day] of (source.days || []).entries()) {
  if (day.day !== index + 1) failures.push(`Expected Day ${index + 1}, found Day ${day.day}.`);
  if (!Array.isArray(day.words) || day.words.length < 3) failures.push(`Day ${day.day} needs at least 3 words.`);
  const words = (day.words || []).map(normalize);
  if (words.some((word) => !word)) failures.push(`Day ${day.day} contains an empty word.`);
  if (new Set(words).size !== words.length) failures.push(`Day ${day.day} contains duplicate words.`);
  words.forEach((word) => {
    if (!meaningData.meanings[word]) failures.push(`Missing Korean meaning for ${word}.`);
  });
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}

const total = source.days.reduce((sum, day) => sum + day.words.length, 0);
console.log(`Validated ${source.days.length} days and ${total} word entries.`);
