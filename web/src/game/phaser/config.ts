import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { GardenScene } from './scenes/GardenScene';

export const createGameConfig = (parentId: string): Phaser.Types.Core.GameConfig => ({
  type: Phaser.AUTO,
  width: 1024,
  height: 768,
  parent: parentId,
  backgroundColor: '#e8f0d8',
  scene: [BootScene, GardenScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  callbacks: {
    postBoot: (game) => {
      const canvas = game.canvas;
      canvas.style.display = 'block';
      canvas.style.maxWidth = '100%';
      canvas.style.maxHeight = '100%';
    },
  },
});
