import { isAnswerCorrect } from '../systems/answer-normalizer';
import { playFeedbackSound, playWordAudio } from '../systems/audio-service';
import { renderWrite, updateWriteDraft } from '../ui/dom-overlay';
import { LessonScene } from './lesson-scene';

const letterAlphabet = 'abcdefghijklmnopqrstuvwxyz';

function createLetterBank(word) {
  const answerCharacters = [...word.word.toLowerCase()].filter((character) => /[a-z ]/.test(character));
  const uniqueCharacters = [...new Set(answerCharacters)];
  const distractors = [...letterAlphabet].filter((letter) => !uniqueCharacters.includes(letter));
  const extraCharacters = distractors.slice(0, Math.max(0, 10 - uniqueCharacters.length));
  return [...uniqueCharacters, ...extraCharacters].sort(() => Math.random() - 0.5);
}

export class WriteSpellScene extends LessonScene {
  constructor() {
    super('WriteSpellScene', 0xe7c76a);
    this.status = '단어를 듣고 영어 스펠링을 적어보세요.';
    this.answer = '';
    this.letters = [];
    this.isTransitioning = false;
  }

  create() {
    if (!this.setupLesson()) return;
    this.letters = createLetterBank(this.currentWord());
    this.renderCurrent();
    playWordAudio(this.currentWord());
  }

  renderCurrent() {
    const word = this.currentWord();
    if (!word) return;
    renderWrite({
      session: this.session,
      word,
      index: this.index,
      score: this.session.score,
      status: this.status,
      answer: this.answer,
      letters: this.letters,
      isTransitioning: this.isTransitioning,
      onExit: () => this.leaveToTitle(),
      onSoundToggle: () => this.toggleSound(),
      onSpeak: () => playWordAudio(word),
      onLetter: (letter) => this.addLetter(letter),
      onBackspace: () => this.removeLetter(),
      onClear: () => this.clearAnswer(),
      onSubmit: (input) => this.handleAnswer(input),
    });
  }

  addLetter(letter) {
    if (this.isTransitioning || this.answer.length >= this.currentWord().word.length) return;
    this.answer += letter;
    this.status = '선택한 글자를 확인하고 제출하세요.';
    updateWriteDraft({ answer: this.answer, status: this.status });
  }

  removeLetter() {
    if (this.isTransitioning) return;
    this.answer = this.answer.slice(0, -1);
    updateWriteDraft({ answer: this.answer });
  }

  clearAnswer() {
    if (this.isTransitioning) return;
    this.answer = '';
    updateWriteDraft({ answer: this.answer });
  }

  handleAnswer(input) {
    if (this.isTransitioning) return;
    if (!String(input).trim()) {
      this.status = '글자를 선택하지 않았습니다.';
      this.renderCurrent();
      return;
    }
    const word = this.currentWord();
    const correct = isAnswerCorrect(input, word);
    this.recordAttempt({ input, correct });
    if (correct) {
      this.status = '책이 빛나며 다음 페이지가 열립니다.';
      playFeedbackSound('correct');
    } else {
      this.status = `페이지가 사라졌습니다. 정답은 ${word.word}입니다.`;
      playFeedbackSound('incorrect');
    }
    this.isTransitioning = true;
    this.renderCurrent();
    this.scheduleNext();
  }

  prepareNextWord() {
    this.answer = '';
    this.letters = createLetterBank(this.currentWord());
    this.status = '단어를 듣고 영어 스펠링을 적어보세요.';
    this.isTransitioning = false;
    playWordAudio(this.currentWord());
  }
}
