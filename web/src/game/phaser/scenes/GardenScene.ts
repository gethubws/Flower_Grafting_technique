import Phaser from 'phaser';
import { bridge, BridgeEvent } from '../../bridge';
import type { GardenSlot } from '../../types';

const POT_POSITIONS = [
  { x: 250, y: 330 }, { x: 512, y: 330 }, { x: 774, y: 330 },
  { x: 250, y: 560 }, { x: 512, y: 560 }, { x: 774, y: 560 },
];

export class GardenScene extends Phaser.Scene {
  private slots: GardenSlot[] = [];
  private flowerObjects: Map<number, Phaser.GameObjects.Container> = new Map();
  private potZones: Map<number, Phaser.GameObjects.Zone> = new Map();
  private activeTool: 'seed' | 'glove' | 'knife' | null = null;
  private bgImage: Phaser.GameObjects.Image | null = null;
  private flowerImages: Map<string, string> = new Map(); // flowerId → imageUrl

  constructor() {
    super({ key: 'GardenScene' });
  }

  preload() {
    this.load.image('bg-garden', '/assets/bg-garden.png');
  }

  create() {
    const W = 1024, H = 768;

    // Background
    try {
      this.bgImage = this.add.image(W / 2, H / 2, 'bg-garden')
        .setDisplaySize(W, H)
        .setAlpha(0.85)
        .setDepth(0);
    } catch (_) {}

    // Draw static garden elements (on top of background)
    const bgLayer = this.add.container(0, 0).setDepth(1);

    // Dirt + pots for all 6 positions
    for (let idx = 0; idx < 6; idx++) {
      const p = POT_POSITIONS[idx];

      bgLayer.add(this.add.ellipse(p.x, p.y + 18, 90, 35, 0x8B4513, 0.85));
      bgLayer.add(this.add.ellipse(p.x, p.y + 15, 80, 28, 0x6B3410, 0.4));

      // Pot
      bgLayer.add(this.add.rectangle(p.x, p.y, 52, 38, 0xa0522d));
      bgLayer.add(this.add.rectangle(p.x, p.y - 18, 56, 8, 0xc97142));
      bgLayer.add(this.add.rectangle(p.x, p.y + 18, 46, 6, 0x8B4513));

      // Interactive zone (higher depth to catch clicks)
      const zone = this.add.zone(p.x, p.y - 20, 80, 100)
        .setInteractive({ useHandCursor: true })
        .setDepth(20);
      this.potZones.set(idx, zone);

      zone.on('pointerover', () => {
        zone.setAlpha(0.1);
        if (this.activeTool) {
          this.input.setDefaultCursor(
            this.activeTool === 'knife' ? 'crosshair' :
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
        bridge.emit(BridgeEvent.POT_CLICKED, {
          position: idx,
          flowerId: slot?.flower?.id || null,
          flower: slot?.flower || null,
        });
      });
    }

    // Title
    this.add.text(W / 2, 20, '🌺 你的花园', {
      fontSize: '24px', color: '#2e3d23', fontFamily: 'Arial',
      stroke: '#2d5a27', strokeThickness: 4,
    }).setOrigin(0.5).setDepth(30);

    this.setupBridgeListeners();
    console.log('🌻 GardenScene ready');
  }

  private refreshSlots(slots: GardenSlot[]) {
    this.slots = slots;

    // Collect image URLs to preload
    const urlsToLoad: { key: string; url: string }[] = [];
    for (const slot of slots) {
      if (slot.flower?.imageUrl && !this.textures.exists(`flower-${slot.flower.id}`)) {
        urlsToLoad.push({ key: `flower-${slot.flower.id}`, url: slot.flower.imageUrl });
      }
    }

    const doRender = () => {
      // Clear existing flowers
      this.flowerObjects.forEach((c) => c.destroy());
      this.flowerObjects.clear();

      // Sort by stage so blooming renders on top
      const sorted = [...slots].sort((a, b) => {
        const order: Record<string, number> = { SEED: 0, SEEDLING: 1, GROWING: 2, MATURE: 3, BLOOMING: 4 };
        return (order[a.flower?.stage || ''] ?? -1) - (order[b.flower?.stage || ''] ?? -1);
      });

      for (const slot of sorted) {
        if (slot.flower) this.renderFlower(slot);
      }
    };

    if (urlsToLoad.length > 0) {
      // Load all new images, then render
      let loaded = 0;
      for (const { key, url } of urlsToLoad) {
        this.load.image(key, url);
      }
      this.load.once('complete', () => {
        console.log(`Loaded ${urlsToLoad.length} flower images`);
        doRender();
      });
      this.load.start();
    } else {
      doRender();
    }
  }

  private renderFlower(slot: GardenSlot) {
    const { x, y } = POT_POSITIONS[slot.position];
    const flower = slot.flower!;
    const container = this.add.container(x, y - 90).setDepth(15);

    // Try loading flower image
    const imgKey = `flower-${flower.id}`;

    if (flower.imageUrl && this.textures.exists(imgKey)) {
      // Show SD-generated flower image
      const img = this.add.image(0, 0, imgKey)
        .setDisplaySize(80, 120)
        .setOrigin(0.5, 0.8);
      container.add(img);
    } else {
      // Fallback: geometric placeholder
      this.addPlaceholderFlower(container, flower);
    }

    // Name + stage labels
    container.add(this.add.text(0, 32, flower.name || '花', {
      fontSize: '9px', color: '#2e3d23', fontFamily: 'Arial',
      stroke: '#000', strokeThickness: 3, align: 'center',
    }).setOrigin(0.5));

    const stageEmoji: Record<string, string> = { SEED: '🌰', SEEDLING: '🌱', GROWING: '🌿', MATURE: '🌼', BLOOMING: '🌸' };
    container.add(this.add.text(0, 44, stageEmoji[flower.stage] || '🌿', {
      fontSize: '12px', align: 'center',
    }).setOrigin(0.5));

    container.setSize(80, 140);
    container.setInteractive();
    this.flowerObjects.set(slot.position, container);
  }

  private addPlaceholderFlower(container: Phaser.GameObjects.Container, flower: any) {
    const stemHMap: Record<string, number> = { SEED: 0, SEEDLING: 18, GROWING: 40, MATURE: 60, BLOOMING: 75 };
    const sH = stemHMap[flower.stage] || 35;
    const rarityColors: Record<string, number> = { N: 0x808080, R: 0x4488ff, SR: 0xaa44ff, SSR: 0xffaa00, UR: 0xff3333 };
    const color = rarityColors[flower.rarity] || 0x808080;

    if (flower.stage !== 'SEED') {
      container.add(this.add.rectangle(0, -sH / 2, 5, sH, 0x2e7d32).setOrigin(0.5));
    }

    if (['GROWING', 'MATURE', 'BLOOMING'].includes(flower.stage)) {
      container.add(this.add.ellipse(-14, -20, 22, 9, 0x43a047));
      container.add(this.add.ellipse(14, -20, 22, 9, 0x43a047));
    }

    const crownY = -sH;
    if (flower.stage === 'SEED') {
      container.add(this.add.circle(0, 2, 6, 0x8B4513));
    } else {
      const crownSize = flower.stage === 'BLOOMING' ? 16 : flower.stage === 'MATURE' ? 12 : 8;
      for (let i = 0; i < 7; i++) {
        const angle = (i / 7) * Math.PI * 2;
        container.add(this.add.circle(
          Math.cos(angle) * crownSize * 0.7,
          crownY + Math.sin(angle) * crownSize * 0.5,
          crownSize * 0.45, color, 0.85
        ));
      }
      container.add(this.add.circle(0, crownY, crownSize * 0.3, 0xffee58));
      if (flower.rarity !== 'N') {
        container.add(this.add.circle(0, crownY - crownSize - 8, 7, color, 0.35));
      }
    }
  }

  private setupBridgeListeners() {
    bridge.on(BridgeEvent.REFRESH_GARDEN, (slots: GardenSlot[]) => {
      this.refreshSlots(slots);
    });
    bridge.on(BridgeEvent.TOOL_ACTIVATED, (payload: { tool: 'seed' | 'glove' | 'knife' | null }) => {
      this.activeTool = payload.tool;
      if (payload.tool === 'knife') {
        this.input.setDefaultCursor('crosshair');
      } else if (payload.tool === 'glove') {
        this.input.setDefaultCursor('pointer');
      } else if (payload.tool === 'seed') {
        this.input.setDefaultCursor('cell');
      } else {
        this.input.setDefaultCursor('default');
      }
    });
  }
}
