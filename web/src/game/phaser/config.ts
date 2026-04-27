import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { GardenScene } from './scenes/GardenScene';

export const createGameConfig = (parentId: string): Phaser.Types.Core.GameConfig => ({
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  parent: parentId,
  transparent: true,
  backgroundColor: '#1a1a2e',
  scene: [BootScene, GardenScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
});
