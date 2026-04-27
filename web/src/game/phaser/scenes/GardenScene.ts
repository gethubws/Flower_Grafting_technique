import Phaser from 'phaser';
import { bridge, BridgeEvent } from '../../bridge';
import type { GardenSlot } from '../../types';

export class GardenScene extends Phaser.Scene {
  private slots: GardenSlot[] = [];
  private flowerObjects: Map<number, Phaser.GameObjects.Container> = new Map();
  private potZones: Map<number, Phaser.GameObjects.Zone> = new Map();
  private activeTool: 'seed' | 'glove' | null = null;

  constructor() {
    super({ key: 'GardenScene' });
  }

  create() {
    const W = 800, H = 600;
    this.add.rectangle(W / 2, 100, W, 200, 0x87ceeb);
    this.add.rectangle(W / 2, 350, W, 500, 0x4caf50);
    this.add.ellipse(120, 60, 100, 40, 0xffffff, 0.6);
    this.add.ellipse(350, 40, 80, 30, 0xffffff, 0.5);
    this.add.ellipse(650, 70, 110, 35, 0xffffff, 0.7);
    this.add.rectangle(W / 2, 205, W, 4, 0xa1887f);
    for (let i = 0; i < 6; i++) {
      this.add.rectangle(5 + i * 160, 225, 8, 40, 0x8d6e63);
    }

    const positions = [
      { x: 150, y: 280 }, { x: 400, y: 280 }, { x: 650, y: 280 },
      { x: 150, y: 480 }, { x: 400, y: 480 }, { x: 650, y: 480 },
    ];

    for (let idx = 0; idx < 6; idx++) {
      const p = positions[idx];
      this.add.ellipse(p.x, p.y + 10, 80, 30, 0x8B4513, 0.8);
      this.add.rectangle(p.x, p.y - 8, 40, 30, 0xa0522d);
      this.add.rectangle(p.x, p.y - 24, 44, 6, 0xc97142);

      // Interactive zone over entire pot + dirt area
      const zone = this.add.zone(p.x, p.y - 15, 70, 80).setInteractive({ useHandCursor: true });
      zone.setDepth(5);
      this.potZones.set(idx, zone);

      zone.on('pointerover', () => {
        zone.setAlpha(0.15);
        if (this.activeTool) {
          this.input.setDefaultCursor(
            this.activeTool === 'seed' ? 'cell' : 'pointer'
          );
        }
      });
      zone.on('pointerout', () => {
        zone.setAlpha(0);
        this.input.setDefaultCursor('default');
      });
      zone.on('pointerdown', () => {
        const slot = this.slots.find((s: GardenSlot) => s.position === idx);
        const flower = slot?.flower || null;
        bridge.emit(BridgeEvent.POT_CLICKED, {
          position: idx,
          flowerId: flower?.id || null,
          flower,
        });
      });
    }

    this.add.text(W / 2, 20, '🌺 你的花园', {
      fontSize: '20px', color: '#ffffff', fontFamily: 'Arial',
      stroke: '#2d5a27', strokeThickness: 3,
    }).setOrigin(0.5);

    this.setupBridgeListeners();
    console.log('🌻 GardenScene ready');
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
    container.setDepth(10);

    const stemHMap: Record<string, number> = { SEED: 0, SEEDLING: 15, GROWING: 35, MATURE: 55, BLOOMING: 70 };
    const sH = stemHMap[flower.stage] || 30;
    const rarityColors: Record<string, number> = { N: 0x808080, R: 0x4488ff, SR: 0xaa44ff, SSR: 0xffaa00, UR: 0xff3333 };
    const color = rarityColors[flower.rarity] || 0x808080;

    if (flower.stage !== 'SEED') {
      const stem = this.add.rectangle(0, -sH / 2, 4, sH, 0x2e7d32).setOrigin(0.5);
      container.add(stem);
    }

    if (['GROWING', 'MATURE', 'BLOOMING'].includes(flower.stage)) {
      const leafY = -20;
      container.add(this.add.ellipse(-12, leafY, 20, 8, 0x43a047));
      container.add(this.add.ellipse(12, leafY, 20, 8, 0x43a047));
    }

    const crownY = -sH;
    if (flower.stage === 'SEED') {
      container.add(this.add.circle(0, 2, 5, 0x8B4513));
    } else {
      const crownSize = flower.stage === 'BLOOMING' ? 14 : flower.stage === 'MATURE' ? 10 : 7;
      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2;
        const px = Math.cos(angle) * crownSize * 0.7;
        const py = crownY + Math.sin(angle) * crownSize * 0.5;
        container.add(this.add.circle(px, py, crownSize * 0.5, color, 0.8));
      }
      container.add(this.add.circle(0, crownY, crownSize * 0.3, 0xffee58));
      if (flower.rarity !== 'N') {
        container.add(this.add.circle(0, crownY - crownSize - 7, 6, color, 0.3));
      }
    }

    const name = flower.name || '花';
    container.add(this.add.text(0, 26, name, {
      fontSize: '9px', color: '#fff', fontFamily: 'Arial',
      stroke: '#000', strokeThickness: 2, align: 'center',
    }).setOrigin(0.5));

    const stageLabels: Record<string, string> = { SEED: '🌰', SEEDLING: '🌱', GROWING: '🌿', MATURE: '🌼', BLOOMING: '🌸' };
    container.add(this.add.text(0, 36, stageLabels[flower.stage] || '', {
      fontSize: '11px', align: 'center',
    }).setOrigin(0.5));

    container.setSize(60, 120);
    container.setInteractive();

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
    bridge.on(BridgeEvent.TOOL_ACTIVATED, (payload: { tool: 'seed' | 'glove' | null }) => {
      this.activeTool = payload.tool;
      // Show cursor hint
      if (payload.tool === 'glove') {
        this.input.setDefaultCursor('pointer');
      } else if (payload.tool === 'seed') {
        this.input.setDefaultCursor('cell');
      } else {
        this.input.setDefaultCursor('default');
      }
    });
  }
}
