import Phaser from 'phaser';
import { isSoundEnabled, setSoundEnabled } from '../systems/audio-service';
import { saveGameResult } from '../systems/local-storage';
import { addAttempt, finishSession, getSession } from '../systems/session-manager';
import { getGameDefinition } from '../ui/dom-overlay';
import { drawSceneBackground } from './scene-background';

export class LessonScene extends Phaser.Scene {
  constructor(key, accent) {
    super(key);
    this.accent = accent;
    this.session = null;
    this.index = 0;
    this.attemptNumber = 1;
    this.nextTimer = null;
  }

  setupLesson() {
    this.session = getSession();
    if (!this.session) {
      this.scene.start('GameSelectScene');
      return false;
    }
    drawSceneBackground(this, this.accent);
    this.index = 0;
    this.attemptNumber = 1;
    this.nextTimer = null;
    return true;
  }

  currentWord() {
    return this.session?.words[this.index];
  }

  leaveToTitle() {
    const shouldLeave = window.confirm('현재 게임을 종료하고 처음으로 돌아갈까요?');
    if (!shouldLeave) return;
    if (this.nextTimer) this.nextTimer.remove(false);
    this.scene.start('TitleScene');
  }

  toggleSound() {
    setSoundEnabled(!isSoundEnabled());
    this.renderCurrent();
  }

  recordAttempt({ input, correct }) {
    const word = this.currentWord();
    addAttempt({
      word: word.word,
      correctAnswer: word.word,
      input,
      correct,
      attemptNumber: this.attemptNumber,
    });
  }

  scheduleNext() {
    if (this.nextTimer) this.nextTimer.remove(false);
    this.nextTimer = this.time.delayedCall(720, () => this.advance());
  }

  advance() {
    this.nextTimer = null;
    if (this.index >= this.session.words.length - 1) {
      const result = finishSession();
      saveGameResult(result.dateKey, result.mode, result);
      this.scene.start('ResultScene', { result });
      return;
    }
    this.index += 1;
    this.attemptNumber = 1;
    this.prepareNextWord?.();
    this.renderCurrent();
  }

  getGameLabel() {
    return getGameDefinition(this.session?.mode)?.label || 'Word Wizard';
  }

  shutdown() {
    if (this.nextTimer) this.nextTimer.remove(false);
  }

  renderCurrent() {
    throw new Error('LessonScene.renderCurrent must be implemented by a game scene');
  }
}
