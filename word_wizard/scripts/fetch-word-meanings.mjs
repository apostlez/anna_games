import { readFile, writeFile } from 'node:fs/promises';

const source = JSON.parse(await readFile(new URL('../data/word_source_extraction.json', import.meta.url), 'utf8'));
const outputUrl = new URL('../data/word_meanings.json', import.meta.url);
const meanings = {};
const overrides = {
  live: '살다',
  woman: '여성',
  people: '사람들',
  'a lot of': '많은',
  earth: '지구',
  can: '캔',
  board: '보드',
  piece: '조각',
  favorite: '가장 좋아하는',
  elementary: '초등의',
  read: '읽다',
  write: '쓰다',
  delicious: '맛있는',
  bitter: '쓴',
  eat: '먹다',
  drink: '마시다',
  bud: '꽃봉오리',
  grow: '자라다',
  make: '만들다',
  cut: '자르다',
};

for (const day of source.days) {
  for (const word of day.words) {
    if (overrides[word.toLowerCase()]) {
      meanings[word.toLowerCase()] = overrides[word.toLowerCase()];
      console.log(`${word} -> ${meanings[word.toLowerCase()]} (override)`);
      continue;
    }
    const query = encodeURIComponent(word);
    let translation;
    const googleResponse = await fetch(`https://clients5.google.com/translate_a/t?client=dict-chrome-ex&sl=en&tl=ko&q=${query}`);
    if (googleResponse.ok) {
      const payload = await googleResponse.json();
      translation = payload[0]?.trim();
    }
    if (!translation) {
      const fallbackResponse = await fetch(`https://api.mymemory.translated.net/get?q=${query}&langpair=en|ko`);
      if (fallbackResponse.ok) {
        const payload = await fallbackResponse.json();
        translation = payload.responseData?.translatedText?.trim();
      }
    }
    if (!translation) throw new Error(`No Korean translation returned for ${word}`);
    meanings[word.toLowerCase()] = translation;
    console.log(`${word} -> ${translation}`);
  }
}

await writeFile(outputUrl, `${JSON.stringify({ source: 'MyMemory en|ko; review before production import', meanings }, null, 2)}\n`, 'utf8');
console.log(`Wrote ${Object.keys(meanings).length} word meanings.`);
