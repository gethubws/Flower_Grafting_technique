import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    // Phase 1: no external assets to load, all graphics are generated.
    // Future: load pot PNG, particle textures, etc.
  }

  create() {
    this.scene.start('GardenScene');
  }
}
