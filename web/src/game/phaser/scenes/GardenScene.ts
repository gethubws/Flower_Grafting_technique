import Phaser from 'phaser';
import { bridge, BridgeEvent } from '../../bridge';
import type { GardenSlot } from '../../types';

export class GardenScene extends Phaser.Scene {
  private slots: GardenSlot[] = [];
  private flowerObjects: Map<number, Phaser.GameObjects.Container> = new Map();

  constructor() {
    super({ key: 'GardenScene' });
  }

  create() {
    const W = 800, H = 600;

    // Sky
    this.add.rectangle(W / 2, 100, W, 200, 0x87ceeb);
    // Grass
    this.add.rectangle(W / 2, 350, W, 500, 0x4caf50);

    // Clouds
    this.add.ellipse(120, 60, 100, 40, 0xffffff, 0.6);
    this.add.ellipse(350, 40, 80, 30, 0xffffff, 0.5);
    this.add.ellipse(650, 70, 110, 35, 0xffffff, 0.7);

    // Fence
    this.add.rectangle(W / 2, 205, W, 4, 0xa1887f);
    for (let i = 0; i < 6; i++) {
      this.add.rectangle(5 + i * 160, 225, 8, 40, 0x8d6e63);
    }

    // 6 dirt patches + pots
    const positions = [
      { x: 150, y: 280 }, { x: 400, y: 280 }, { x: 650, y: 280 },
      { x: 150, y: 480 }, { x: 400, y: 480 }, { x: 650, y: 480 },
    ];

    for (let idx = 0; idx < 6; idx++) {
      const p = positions[idx];
      // Dirt
      this.add.ellipse(p.x, p.y + 10, 80, 30, 0x8B4513, 0.8);
      // Pot body (trapezoid with rectangle)
      this.add.rectangle(p.x, p.y - 8, 40, 30, 0xa0522d);
      // Pot rim
      this.add.rectangle(p.x, p.y - 24, 44, 6, 0xc97142);
      // Slot number
      this.add.text(p.x, p.y + 22, `#${idx + 1}`, {
        fontSize: '11px',
        color: '#d4a574',
        fontFamily: 'Arial',
        stroke: '#5d3a1a',
        strokeThickness: 1,
      }).setOrigin(0.5);
    }

    // Title
    this.add.text(W / 2, 20, '🌺 你的花园', {
      fontSize: '20px',
      color: '#ffffff',
      fontFamily: 'Arial',
      stroke: '#2d5a27',
      strokeThickness: 3,
    }).setOrigin(0.5);

    this.setupBridgeListeners();
    console.log('🌻 GardenScene created - background drawn');
  }

  private getSlotCenter(position: number) {
    const positions = [
      { x: 150, y: 280 }, { x: 400, y: 280 }, { x: 650, y: 280 },
      { x: 150, y: 480 }, { x: 400, y: 480 }, { x: 650, y: 480 },
    ];
    return positions[position] || { x: 400, y: 300 };
  }

  private createFlowerObject(slot: GardenSlot) {
    const { x, y } = this.getSlotCenter(slot.position);
    const flower = slot.flower;
    if (!flower) return;

    const container = this.add.container(x, y - 70);

    const leafY = -20;
    const stemHeight: Record<string, number> = { SEED: 0, SEEDLING: 15, GROWING: 35, MATURE: 55, BLOOMING: 70 };
    const sH = stemHeight[flower.stage] || 30;
    const rarityColors: Record<string, number> = { N: 0x808080, R: 0x4488ff, SR: 0xaa44ff, SSR: 0xffaa00, UR: 0xff3333 };
    const color = rarityColors[flower.rarity] || 0x808080;

    // Stem
    if (flower.stage !== 'SEED') {
      const stem = this.add.rectangle(0, -sH / 2, 4, sH, 0x2e7d32);
      stem.setOrigin(0.5);
      container.add(stem);
    }

    // Leaves for GROWING+
    if (['GROWING', 'MATURE', 'BLOOMING'].includes(flower.stage)) {
      const leafL = this.add.ellipse(-12, leafY, 20, 8, 0x43a047);
      const leafR = this.add.ellipse(12, leafY, 20, 8, 0x43a047);
      container.add([leafL, leafR]);
    }

    // Crown
    const crownY = -sH;
    if (flower.stage === 'SEED') {
      const seed = this.add.circle(0, 2, 5, 0x8B4513);
      container.add(seed);
    } else {
      const crownSize = flower.stage === 'BLOOMING' ? 14 : flower.stage === 'MATURE' ? 10 : 7;
      // Petals
      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2;
        const px = Math.cos(angle) * crownSize * 0.7;
        const py = crownY + Math.sin(angle) * crownSize * 0.5;
        container.add(this.add.circle(px, py, crownSize * 0.5, color, 0.8));
      }
      // Center
      container.add(this.add.circle(0, crownY, crownSize * 0.3, 0xffee58));

      // Rarity badge
      if (flower.rarity !== 'N') {
        const bY = crownY - crownSize - 7;
        container.add(this.add.circle(0, bY, 6, color, 0.3));
      }
    }

    // Name
    const name = flower.name || '花';
    container.add(this.add.text(0, 26, name, {
      fontSize: '9px', color: '#fff', fontFamily: 'Arial',
      stroke: '#000', strokeThickness: 2, align: 'center',
    }).setOrigin(0.5));

    // Stage emoji label
    const stageLabels: Record<string, string> = { SEED: '🌰', SEEDLING: '🌱', GROWING: '🌿', MATURE: '🌼', BLOOMING: '🌸' };
    container.add(this.add.text(0, 36, stageLabels[flower.stage] || '', {
      fontSize: '11px', align: 'center',
    }).setOrigin(0.5));

    container.setDepth(10);
    container.setSize(60, 120);
    container.setInteractive();
    container.on('pointerover', () => this.tweens.add({ targets: container, scaleX: 1.08, scaleY: 1.08, duration: 100 }));
    container.on('pointerout', () => this.tweens.add({ targets: container, scaleX: 1, scaleY: 1, duration: 100 }));
    container.on('pointerdown', () => bridge.emit(BridgeEvent.SLOT_CLICKED, slot.position, flower.id));

    this.flowerObjects.set(slot.position, container);
  }

  private refreshSlots(slots: GardenSlot[]) {
    this.slots = slots;
    this.flowerObjects.forEach((c) => c.destroy());
    this.flowerObjects.clear();
    for (const slot of slots) {
      if (slot.flower) this.createFlowerObject(slot);
    }
  }

  private setupBridgeListeners() {
    bridge.on(BridgeEvent.REFRESH_GARDEN, (slots: GardenSlot[]) => {
      this.refreshSlots(slots);
    });
  }
}
