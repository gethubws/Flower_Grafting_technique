import Phaser from 'phaser';
import { bridge, BridgeEvent } from '../../bridge';
import type { GardenSlot } from '../../types';

export class GardenScene extends Phaser.Scene {
  private slots: GardenSlot[] = [];
  private flowerObjects: Map<number, Phaser.GameObjects.Container> = new Map();
  private bgDrawn = false;

  constructor() {
    super({ key: 'GardenScene' });
  }

  create() {
    this.drawBackground();
    this.setupBridgeListeners();
  }

  private drawBackground() {
    if (this.bgDrawn) return;
    this.bgDrawn = true;
    const W = 800, H = 600;

    // Sky gradient
    const sky = this.add.graphics();
    sky.fillGradientStyle(0x87ceeb, 0x87ceeb, 0xc8e6c9, 0xc8e6c9, 1);
    sky.fillRect(0, 0, W, H * 0.35);

    // Grass
    const grass = this.add.graphics();
    grass.fillStyle(0x4caf50, 1);
    grass.fillRect(0, H * 0.3, W, H * 0.7);

    // Dirt patches (6 positions in 2×3 grid)
    const positions = [
      { x: 150, y: 250 }, { x: 400, y: 250 }, { x: 650, y: 250 },
      { x: 150, y: 450 }, { x: 400, y: 450 }, { x: 650, y: 450 },
    ];

    for (const pos of positions) {
      // Dirt area
      const dirt = this.add.graphics();
      dirt.fillStyle(0x8B4513, 1);
      dirt.fillEllipse(pos.x, pos.y + 20, 80, 30);

      // Pot
      this.drawPot(pos.x, pos.y);
    }

    // Decorative elements
    const deco = this.add.graphics();
    // Clouds
    deco.fillStyle(0xffffff, 0.7);
    deco.fillEllipse(120, 60, 100, 40);
    deco.fillEllipse(350, 40, 80, 30);
    deco.fillEllipse(650, 70, 110, 35);
    // Fence posts
    deco.fillStyle(0x8d6e63, 1);
    for (let i = 0; i < 6; i++) {
      deco.fillRect(5 + i * 160, H * 0.38, 8, 40);
    }
    deco.fillStyle(0xa1887f, 1);
    deco.fillRect(0, H * 0.38, W, 4);
  }

  private drawPot(x: number, y: number) {
    const pot = this.add.graphics();
    const potTop = y - 20;
    const potBottom = y + 15;
    const potWidth = 20;

    // Pot body (trapezoid)
    pot.fillStyle(0xa0522d, 1);
    pot.beginPath();
    pot.moveTo(x - potWidth - 5, potTop);
    pot.lineTo(x + potWidth + 5, potTop);
    pot.lineTo(x + potWidth, potBottom);
    pot.lineTo(x - potWidth, potBottom);
    pot.closePath();
    pot.fillPath();

    // Pot rim
    pot.fillStyle(0xc97142, 1);
    pot.fillRect(x - potWidth - 8, potTop - 4, (potWidth + 8) * 2, 8);

    // Pot shadow
    pot.fillStyle(0x000000, 0.15);
    pot.fillEllipse(x, potBottom + 5, potWidth * 2.5, 8);
  }

  private getSlotCenter(position: number) {
    const positions = [
      { x: 150, y: 250 }, { x: 400, y: 250 }, { x: 650, y: 250 },
      { x: 150, y: 450 }, { x: 400, y: 450 }, { x: 650, y: 450 },
    ];
    return positions[position] || { x: 400, y: 300 };
  }

  private createFlowerObject(slot: GardenSlot) {
    const { x, y } = this.getSlotCenter(slot.position);
    const flower = slot.flower;
    if (!flower) return;

    const container = this.add.container(x, y - 50);

    // Stage-based height
    const stageMap: Record<string, number> = { SEED: 0, SEEDLING: 15, GROWING: 35, MATURE: 55, BLOOMING: 70 };
    const stemHeight = stageMap[flower.stage] || 30;

    // Rarity color
    const rarityColors: Record<string, number> = { N: 0x808080, R: 0x4488ff, SR: 0xaa44ff, SSR: 0xffaa00, UR: 0xff3333 };
    const color = rarityColors[flower.rarity] || 0x808080;

    const gfx = this.add.graphics();

    if (flower.stage === 'SEED') {
      // Just a small seed dot
      gfx.fillStyle(0x8B4513, 1);
      gfx.fillCircle(0, 5, 5);
    } else {
      // Stem
      gfx.lineStyle(3, 0x2e7d32);
      gfx.beginPath();
      gfx.moveTo(0, 0);
      gfx.lineTo(0, -stemHeight);
      gfx.strokePath();

      // Leaves for GROWING+
      if (['GROWING', 'MATURE', 'BLOOMING'].includes(flower.stage)) {
        gfx.fillStyle(0x43a047, 1);
        const leafY = -stemHeight * 0.5;
        gfx.fillEllipse(-12, leafY, 20, 8);
        gfx.fillEllipse(12, leafY, 20, 8);
      }

      // Flower crown
      const crownY = -stemHeight;
      const crownSize = flower.stage === 'BLOOMING' ? 16 : flower.stage === 'MATURE' ? 12 : 8;

      // Petals
      gfx.fillStyle(color, 0.9);
      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2;
        const px = Math.cos(angle) * crownSize;
        const py = crownY + Math.sin(angle) * crownSize * 0.6;
        gfx.fillCircle(px, py, crownSize * 0.55);
      }

      // Center
      gfx.fillStyle(0xffee58, 1);
      gfx.fillCircle(0, crownY, crownSize * 0.35);

      // Rarity badge
      if (flower.rarity !== 'N') {
        const badgeY = crownY - crownSize - 8;
        gfx.fillStyle(color, 0.3);
        gfx.fillCircle(0, badgeY, 8);
        gfx.lineStyle(1, color, 0.8);
        gfx.strokeCircle(0, badgeY, 8);
      }
    }

    container.add(gfx);

    // Name label
    const name = flower.name || '花';
    const label = this.add.text(0, 25, name, {
      fontSize: '10px',
      color: '#ffffff',
      fontFamily: 'Arial',
      stroke: '#000000',
      strokeThickness: 2,
      align: 'center',
    }).setOrigin(0.5);
    container.add(label);

    // Stage label
    const stageLabels: Record<string, string> = { SEED: '🌰种子', SEEDLING: '🌱幼苗', GROWING: '🌿成长', MATURE: '🌼成熟', BLOOMING: '🌸盛放' };
    const stageText = this.add.text(0, 38, stageLabels[flower.stage] || flower.stage, {
      fontSize: '9px',
      color: '#aaaaaa',
      fontFamily: 'Arial',
      align: 'center',
    }).setOrigin(0.5);
    container.add(stageText);

    container.setDepth(10);
    container.setInteractive(new Phaser.Geom.Rectangle(-30, -80, 60, 120), Phaser.Geom.Rectangle.Contains);

    container.on('pointerover', () => {
      this.tweens.add({ targets: container, scaleX: 1.08, scaleY: 1.08, duration: 100 });
    });
    container.on('pointerout', () => {
      this.tweens.add({ targets: container, scaleX: 1, scaleY: 1, duration: 100 });
    });
    container.on('pointerdown', () => {
      bridge.emit(BridgeEvent.SLOT_CLICKED, slot.position, flower.id);
    });

    this.flowerObjects.set(slot.position, container);
  }

  private refreshSlots(slots: GardenSlot[]) {
    this.slots = slots;
    // Clear old
    this.flowerObjects.forEach((c) => c.destroy(true));
    this.flowerObjects.clear();

    for (const slot of slots) {
      if (slot.flower) {
        this.createFlowerObject(slot);
      }
    }
  }

  private setupBridgeListeners() {
    bridge.on(BridgeEvent.REFRESH_GARDEN, (slots: GardenSlot[]) => {
      this.refreshSlots(slots);
    });
  }
}
