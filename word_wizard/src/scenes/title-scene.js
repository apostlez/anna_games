import Phaser from 'phaser';
import { clearSession } from '../systems/session-manager';
import { renderTitle } from '../ui/dom-overlay';
import { drawSceneBackground } from './scene-background';

export class TitleScene extends Phaser.Scene {
  constructor() {
    super('TitleScene');
  }

  create() {
    clearSession();
    drawSceneBackground(this, 0x82b29a);
    renderTitle({
      onStart: () => this.scene.start('GameSelectScene'),
    });
  }
}
