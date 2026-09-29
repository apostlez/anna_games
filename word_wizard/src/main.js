import Phaser from 'phaser';
import '../style.css';
import { BroomFlightScene } from './scenes/broom-flight-scene';
import { BootScene } from './scenes/boot-scene';
import { GameSelectScene } from './scenes/game-select-scene';
import { PreloadScene } from './scenes/preload-scene';
import { ResultScene } from './scenes/result-scene';
import { SpeakSpellScene } from './scenes/speak-spell-scene';
import { TitleScene } from './scenes/title-scene';
import { WriteSpellScene } from './scenes/write-spell-scene';

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game-root',
  width: 1280,
  height: 720,
  backgroundColor: '#101b1d',
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [
    BootScene,
    PreloadScene,
    TitleScene,
    GameSelectScene,
    SpeakSpellScene,
    WriteSpellScene,
    BroomFlightScene,
    ResultScene,
  ],
});
