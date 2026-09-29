import sourceData from '../../data/word_source_extraction.json';
import meaningData from '../../data/word_meanings.json';
import { supabase } from '../config/supabase';
import { normalizeAnswer } from './answer-normalizer';

const categoryMeanings = {
  family: '가족과 사람',
  people: '사람',
  numbers: '숫자',
  feelings: '감정',
  school: '학교',
  subjects: '교과목',
  'numbers-and-math': '수학과 숫자',
  science: '과학',
  art: '미술',
  music: '음악',
  hobbies: '취미',
  'food-and-meals': '음식과 식사',
  things: '사물',
  flowers: '꽃과 식물',
  animals: '동물',
  'sea-animals': '바다 동물',
  insects: '곤충',
  jobs: '직업',
  time: '시간',
  week: '요일과 주말',
  months: '달',
  'seasons-and-holidays': '계절과 휴일',
  location: '위치',
  town: '마을',
  city: '도시',
  nations: '나라',
  castle: '성',
  clothes: '옷',
  adjectives: '상태를 나타내는 말',
  actions: '동작',
};

function toSeedWord(day, category, word, index) {
  const cleanedWord = String(word).trim();
  return {
    id: `day-${day}-${index + 1}`,
    studyDate: `day-${day}`,
    dateLabel: `Day ${day}`,
    day,
    level: '3-4',
    word: cleanedWord,
    normalizedWord: normalizeAnswer(cleanedWord),
    answerVariants: [],
    meaningKo: meaningData.meanings[cleanedWord.toLowerCase()] || categoryMeanings[category] || category,
    phonics: null,
    audioUrl: sourceData.audioUrlPattern.replace('{day}', String(day)),
    audioStart: null,
    audioEnd: null,
    sourceAudioUrl: sourceData.audioUrlPattern.replace('{day}', String(day)),
    category,
    active: true,
  };
}

function getSeedWords() {
  return sourceData.days.flatMap((entry) => entry.words.map((word, index) => (
    toSeedWord(entry.day, entry.category, word, index)
  )));
}

function normalizeRemoteWord(row) {
  const word = String(row.word || '').trim();
  if (!word || !row.study_date || !row.meaning_ko) return null;
  return {
    id: row.id,
    studyDate: row.study_date,
    dateLabel: row.study_date,
    day: row.day || null,
    level: row.level,
    word,
    normalizedWord: row.normalized_word || normalizeAnswer(word),
    answerVariants: row.answer_variants || [],
    meaningKo: meaningData.meanings[word.toLowerCase()] || row.meaning_ko,
    phonics: row.phonics || null,
    audioUrl: row.audio_url || null,
    audioStart: row.audio_start,
    audioEnd: row.audio_end,
    sourceAudioUrl: row.source_audio_url || row.audio_url || null,
    category: row.category || 'word study',
    active: row.active !== false,
  };
}

function groupWords(words) {
  const groups = new Map();
  words.filter((word) => word.active).forEach((word) => {
    if (!groups.has(word.studyDate)) {
      groups.set(word.studyDate, {
        dateKey: word.studyDate,
        label: word.dateLabel || word.studyDate,
        words: [],
      });
    }
    groups.get(word.studyDate).words.push(word);
  });

  return [...groups.values()].sort((left, right) => left.label.localeCompare(right.label, undefined, { numeric: true }));
}

async function loadRemoteWords() {
  const request = supabase
    .from('words')
    .select('id, study_date, level, word, normalized_word, answer_variants, meaning_ko, phonics, audio_url, audio_start, audio_end, source_audio_url, active')
    .eq('active', true)
    .order('study_date')
    .order('word');
  const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('Supabase request timed out')), 2500));
  const { data, error } = await Promise.race([request, timeout]);
  if (error) throw error;
  return (data || []).map(normalizeRemoteWord).filter(Boolean);
}

export async function loadWordSets() {
  const seedGroups = groupWords(getSeedWords());
  try {
    const remoteGroups = groupWords(await loadRemoteWords());
    const validRemote = remoteGroups.every((group) => group.words.length >= 3);
    if (remoteGroups.length > 0 && validRemote) {
      return { groups: remoteGroups, source: 'supabase' };
    }
  } catch {
    // Local extracted data keeps the demo playable when Supabase is unavailable.
  }
  return { groups: seedGroups, source: 'local-seed' };
}
