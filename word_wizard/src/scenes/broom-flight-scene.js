import { normalizeAnswer } from '../systems/answer-normalizer';
import { playFeedbackSound } from '../systems/audio-service';
import { renderFlight } from '../ui/dom-overlay';
import { LessonScene } from './lesson-scene';

function choicesFor(word, words, promptType) {
  const distractors = words
    .filter((candidate) => candidate.id !== word.id && normalizeAnswer(candidate.word) !== normalizeAnswer(word.word))
    .sort(() => Math.random() - 0.5)
    .slice(0, 2);
  return [word, ...distractors]
    .map((candidate) => ({
      value: candidate.word,
      label: promptType === 'word' ? candidate.meaningKo : candidate.word,
    }))
    .sort(() => Math.random() - 0.5);
}

export class BroomFlightScene extends LessonScene {
  constructor() {
    super('BroomFlightScene', 0x82b29a);
    this.status = '문제에 맞는 선택지를 고르세요.';
    this.choices = [];
    this.promptType = 'meaning';
  }

  create() {
    if (!this.setupLesson()) return;
    this.refreshChoices();
    this.renderCurrent();
  }

  refreshChoices() {
    this.promptType = Math.random() < 0.5 ? 'word' : 'meaning';
    this.choices = choicesFor(this.currentWord(), this.session.words, this.promptType);
  }

  renderCurrent() {
    const word = this.currentWord();
    if (!word) return;
    renderFlight({
      session: this.session,
      word,
      index: this.index,
      score: this.session.score,
      promptType: this.promptType,
      choices: this.choices,
      status: this.status,
      onExit: () => this.leaveToTitle(),
      onSoundToggle: () => this.toggleSound(),
      onChoose: (choice) => this.handleChoice(choice),
    });
  }

  handleChoice(choice) {
    const word = this.currentWord();
    const correct = normalizeAnswer(choice.value) === normalizeAnswer(word.word);
    this.recordAttempt({ input: choice.label, correct });
    this.status = correct
      ? '정답 길입니다. 빗자루가 앞으로 날아갑니다.'
      : `잘못된 길입니다. 정답은 ${word.word}입니다.`;
    playFeedbackSound(correct ? 'correct' : 'incorrect');
    this.renderCurrent();
    this.scheduleNext();
  }

  prepareNextWord() {
    this.refreshChoices();
    this.status = '문제에 맞는 선택지를 고르세요.';
  }
}
