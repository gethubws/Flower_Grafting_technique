import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { GardenScene } from './scenes/GardenScene';

export const createGameConfig = (parentId: string): Phaser.Types.Core.GameConfig => ({
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  parent: parentId,
  backgroundColor: '#2d5a27',
  scene: [BootScene, GardenScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  // 确保canvas可见
  callbacks: {
    postBoot: (game) => {
      const canvas = game.canvas;
      canvas.style.display = 'block';
      canvas.style.maxWidth = '100%';
      canvas.style.maxHeight = '100%';
    },
  },
});
