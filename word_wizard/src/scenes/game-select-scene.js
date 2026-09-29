import Phaser from 'phaser';
import { isSoundEnabled, setSoundEnabled } from '../systems/audio-service';
import { getDateProgress } from '../systems/local-storage';
import { startSession } from '../systems/session-manager';
import { loadWordSets } from '../systems/word-repository';
import { renderError, renderLoading, renderSelection } from '../ui/dom-overlay';
import { drawSceneBackground } from './scene-background';

const sceneByMode = {
  speak: 'SpeakSpellScene',
  write: 'WriteSpellScene',
  flight: 'BroomFlightScene',
};

export class GameSelectScene extends Phaser.Scene {
  constructor() {
    super('GameSelectScene');
    this.groups = [];
    this.source = 'local-seed';
    this.selectedDateKey = null;
  }

  create() {
    drawSceneBackground(this, 0xe7c76a);
    renderLoading();
    this.loadData();
  }

  async loadData() {
    try {
      const result = await loadWordSets();
      this.groups = result.groups;
      this.source = result.source;
      this.selectedDateKey = this.groups[0]?.dateKey || null;
      if (!this.groups.length) throw new Error('사용 가능한 날짜별 단어가 없습니다.');
      this.renderSelection();
    } catch (error) {
      renderError(error.message || '단어 데이터를 불러오지 못했습니다.', {
        onRetry: () => this.scene.restart(),
        onExit: () => this.scene.start('TitleScene'),
      });
    }
  }

  renderSelection() {
    renderSelection({
      groups: this.groups,
      selectedDateKey: this.selectedDateKey,
      source: this.source,
      onSelectDate: (dateKey) => {
        this.selectedDateKey = dateKey;
        this.renderSelection();
      },
      onSelectGame: (mode) => this.selectGame(mode),
      onExit: () => this.scene.start('TitleScene'),
      onSoundToggle: () => {
        setSoundEnabled(!isSoundEnabled());
        this.renderSelection();
      },
    });
  }

  selectGame(mode) {
    const group = this.groups.find((entry) => entry.dateKey === this.selectedDateKey);
    if (!group || group.words.length < 3 || !sceneByMode[mode]) return;
    startSession({
      dateKey: group.dateKey,
      dateLabel: group.label,
      mode,
      words: group.words,
    });
    this.registry.set('lastWords', group.words);
    this.scene.start(sceneByMode[mode]);
  }
}
