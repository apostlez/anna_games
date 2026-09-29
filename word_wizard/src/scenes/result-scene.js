import Phaser from 'phaser';
import { startSession } from '../systems/session-manager';
import { getGameDefinition, renderResult } from '../ui/dom-overlay';
import { drawSceneBackground } from './scene-background';

export class ResultScene extends Phaser.Scene {
  constructor() {
    super('ResultScene');
    this.result = null;
  }

  init(data) {
    this.result = data.result || null;
  }

  create() {
    if (!this.result) {
      this.scene.start('GameSelectScene');
      return;
    }
    drawSceneBackground(this, 0xe7c76a);
    const gameLabel = getGameDefinition(this.result.mode)?.label || 'Word Wizard';
    renderResult({
      result: this.result,
      gameLabel,
      onReplay: () => this.replay(),
      onSelect: () => this.scene.start('GameSelectScene'),
      onExit: () => this.scene.start('TitleScene'),
    });
  }

  replay() {
    const { dateKey, dateLabel, mode } = this.result;
    const words = this.registry.get('lastWords') || [];
    if (!words.length) {
      this.scene.start('GameSelectScene');
      return;
    }
    startSession({ dateKey, dateLabel, mode, words });
    const sceneKey = mode === 'speak' ? 'SpeakSpellScene' : mode === 'write' ? 'WriteSpellScene' : 'BroomFlightScene';
    this.scene.start(sceneKey);
  }
}
