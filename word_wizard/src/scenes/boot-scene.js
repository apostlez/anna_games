import Phaser from 'phaser';
import { createEmptyProgress } from '../systems/local-storage';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  create() {
    this.registry.set('emptyProgress', createEmptyProgress());
    this.scene.start('PreloadScene');
  }
}
