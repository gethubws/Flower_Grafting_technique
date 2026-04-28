import Phaser from 'phaser';
import { bridge, BridgeEvent } from '../../bridge';
import type { GardenSlot } from '../../types';

const POT_POSITIONS = [
  { x: 250, y: 330 }, { x: 512, y: 330 }, { x: 774, y: 330 },
  { x: 250, y: 560 }, { x: 512, y: 560 }, { x: 774, y: 560 },
];

// Stage → visual params
const STAGE_CONFIG: Record<string, { label: string; colors: number[]; labelColor: string; labelBg: number[]; scale: number }> = {
  SEED:     { label: '🌰 种子', colors: [0xD7CCC8, 0xA1887F], labelColor: '#5D4037', labelBg: [0xD7CCC8, 0xA1887F], scale: 0.85 },
  SEEDLING: { label: '🌱 幼苗', colors: [0xC8E6C9, 0x81C784], labelColor: '#1B5E20', labelBg: [0xC8E6C9, 0x81C784], scale: 0.92 },
  GROWING:  { label: '🌿 成长', colors: [0xB3E5FC, 0x4FC3F7], labelColor: '#01579B', labelBg: [0xB3E5FC, 0x4FC3F7], scale: 1.0 },
  MATURE:   { label: '🌼 成熟', colors: [0xFFF176, 0xFFD54F], labelColor: '#5D4037', labelBg: [0xFFF176, 0xFFD54F], scale: 1.05 },
  BLOOMING: { label: '🌸 盛放', colors: [0xFFF176, 0xFFD54F], labelColor: '#5D4037', labelBg: [0xFFF176, 0xFFD54F], scale: 1.1 },
  RECOVERING:{ label: '🩹 恢复', colors: [0xFFCDD2, 0xEF9A9A], labelColor: '#B71C1C', labelBg: [0xFFCDD2, 0xEF9A9A], scale: 0.9 },
};
const DEFAULT_STAGE = STAGE_CONFIG.GROWING;

// Rarity base colors (hue for flower)
const RARITY_COLORS: Record<string, number> = { N: 0x9E9E9E, R: 0x42A5F5, SR: 0xAB47BC, SSR: 0xFFB300, UR: 0xEF5350 };

export class GardenScene extends Phaser.Scene {
  private slots: GardenSlot[] = [];
  private flowerObjects: Map<number, Phaser.GameObjects.Container> = new Map();
  private potZones: Map<number, Phaser.GameObjects.Zone> = new Map();
  private potGraphics: Map<number, Phaser.GameObjects.Container> = new Map();
  private activeTool: 'seed' | 'glove' | 'knife' | null = null;
  private bgImage: Phaser.GameObjects.Image | null = null;

  constructor() { super({ key: 'GardenScene' }); }

  preload() {
    this.load.image('bg-garden', '/assets/bg-garden.png');
    this.load.image('pot-clay', '/assets/pot.png');
  }

  create() {
    const W = 1024, H = 768;

    // Background
    try {
      this.bgImage = this.add.image(W / 2, H / 2, 'bg-garden')
        .setDisplaySize(W, H).setAlpha(0.85).setDepth(0);
    } catch (_) {}

    // Draw grass tint layer
    const grassOverlay = this.add.graphics().setDepth(0.5);
    grassOverlay.fillGradientStyle(0x7CB342, 0x7CB342, 0x558B2F, 0x558B2F, 0.08);
    grassOverlay.fillRect(0, H * 0.55, W, H * 0.45);

    // Draw soil patches and pots
    for (let idx = 0; idx < 6; idx++) {
      this.drawPot(idx);
      this.setupPotZone(idx);
    }

    // Title
    this.add.text(W / 2, 14, '🌺 你的花园', {
      fontSize: '22px', color: '#3E2723', fontFamily: 'Nunito, PingFang SC, Arial',
      stroke: '#FFFFFF', strokeThickness: 5,
    }).setOrigin(0.5).setDepth(30);

    this.setupBridgeListeners();
    // Resize handler to recalculate pot positions
    window.addEventListener('resize', () => this.emitPotPositions());
    console.log('🌻 GardenScene ready');
  }

  private drawPot(idx: number) {
    const p = POT_POSITIONS[idx];
    const g = this.add.container(p.x, p.y).setDepth(1);

    // Pot shadow on ground
    const shadow = this.add.graphics();
    shadow.fillStyle(0x3E2723, 0.12);
    shadow.fillEllipse(0, 22, 80, 16);
    g.add(shadow);

    // Clay pot PNG (centered, no bg, pot mouth at y≈-40)
    const pot = this.add.image(0, 0, 'pot-clay').setOrigin(0.5, 0.42).setDisplaySize(96, 82);
    g.add(pot);

    this.potGraphics.set(idx, g);
  }

  private setupPotZone(idx: number) {
    const p = POT_POSITIONS[idx];
    // Interactive zone covers the pot + soil area
    const zone = this.add.zone(p.x, p.y - 20, 80, 100)
      .setInteractive({ useHandCursor: true }).setDepth(20);
    this.potZones.set(idx, zone);

    let hovered = false;
    zone.on('pointerover', () => {
      hovered = true;
      zone.setAlpha(0.06);
      // Scale pot up slightly on hover
      const potG = this.potGraphics.get(idx);
      if (potG) this.tweens.add({ targets: potG, scaleX: 1.06, scaleY: 1.06, y: POT_POSITIONS[idx].y - 2, duration: 200, ease: 'Back.easeOut' });
      if (this.activeTool) {
        this.input.setDefaultCursor(
          this.activeTool === 'knife' ? 'crosshair' : this.activeTool === 'seed' ? 'cell' : 'pointer'
        );
      }
    });
    zone.on('pointerout', () => {
      hovered = false;
      zone.setAlpha(0);
      const potG = this.potGraphics.get(idx);
      if (potG) this.tweens.add({ targets: potG, scaleX: 1, scaleY: 1, y: POT_POSITIONS[idx].y, duration: 200, ease: 'Back.easeOut' });
      this.input.setDefaultCursor('default');
    });
    zone.on('pointerdown', () => {
      const slot = this.slots.find((s: GardenSlot) => s.position === idx);
      // Emit pot click (for tool actions)
      bridge.emit(BridgeEvent.POT_CLICKED, {
        position: idx,
        flowerId: slot?.flower?.id || null,
        flower: slot?.flower || null,
      });
      // Also emit detail request (for React popup) with screen position
      const canvas = this.sys.game.canvas.getBoundingClientRect();
      bridge.emit(BridgeEvent.POT_DETAIL_TOGGLE, {
        position: idx,
        flower: slot?.flower || null,
        screenX: canvas.left + p.x,
        screenY: canvas.top + p.y - 30,
      });
    });
  }

  private emitPotPositions() {
    // Notify React of pot positions for popup placement
    const canvas = this.sys.game.canvas.getBoundingClientRect();
    for (let idx = 0; idx < 6; idx++) {
      const p = POT_POSITIONS[idx];
      const slot = this.slots.find((s: GardenSlot) => s.position === idx);
      bridge.emit(BridgeEvent.POT_POSITION, {
        position: idx,
        flower: slot?.flower || null,
        screenX: canvas.left + p.x,
        screenY: canvas.top + p.y - 30,
      });
    }
  }

  private refreshSlots(slots: GardenSlot[]) {
    this.slots = slots;
    const urlsToLoad: { key: string; url: string }[] = [];
    for (const slot of slots) {
      if (slot.flower?.imageUrl && !this.textures.exists(`flower-${slot.flower.id}`)) {
        urlsToLoad.push({ key: `flower-${slot.flower.id}`, url: slot.flower.imageUrl });
      }
    }
    const doRender = () => {
      this.flowerObjects.forEach((c) => c.destroy());
      this.flowerObjects.clear();
      const sorted = [...slots].sort((a, b) => {
        const order: Record<string, number> = { SEED: 0, SEEDLING: 1, GROWING: 2, MATURE: 3, BLOOMING: 4 };
        return (order[a.flower?.stage || ''] ?? -1) - (order[b.flower?.stage || ''] ?? -1);
      });
      for (const slot of sorted) { if (slot.flower) this.renderFlower(slot); }
      // Update pot positions for React
      setTimeout(() => this.emitPotPositions(), 100);
    };
    if (urlsToLoad.length > 0) {
      for (const { key, url } of urlsToLoad) { this.load.image(key, url); }
      this.load.once('complete', () => { doRender(); });
      this.load.start();
    } else { doRender(); }
  }

  private renderFlower(slot: GardenSlot) {
    const { x, y } = POT_POSITIONS[slot.position];
    const flower = slot.flower!;
    const stageCfg = STAGE_CONFIG[flower.stage] || DEFAULT_STAGE;
    const rarityColor = RARITY_COLORS[flower.rarity] || 0x9E9E9E;
    const container = this.add.container(x, y - 95).setDepth(15);

    // Stage-based height
    const stemHeight = flower.stage === 'SEED' ? 0 : flower.stage === 'SEEDLING' ? 22 :
      flower.stage === 'GROWING' ? 48 : flower.stage === 'MATURE' ? 65 : flower.stage === 'BLOOMING' ? 82 : 48;
    const crownY = -stemHeight;

    // Load image or draw placeholder
    const imgKey = `flower-${flower.id}`;
    if (flower.imageUrl && this.textures.exists(imgKey)) {
      const imgH = Math.max(60, stemHeight + 30);
      const img = this.add.image(0, crownY, imgKey)
        .setDisplaySize(80, imgH).setOrigin(0.5, 0.5);
      container.add(img);
    } else {
      this.drawPlaceholderFlower(container, flower, stemHeight, crownY, rarityColor);
    }

    // Name label (small, below flower)
    const nameText = this.add.text(0, 26, flower.name || '花', {
      fontSize: '9px', color: '#3E2723', fontFamily: 'Nunito, Arial',
      stroke: '#FFFFFF', strokeThickness: 2, align: 'center',
    }).setOrigin(0.5);
    container.add(nameText);

    // Stage badge label (colored pill above pot)
    const badge = this.drawStageBadge(0, -stemHeight - 26, flower.stage, stageCfg);
    container.add(badge);

    container.setSize(80, 140);
    container.setInteractive();
    this.flowerObjects.set(slot.position, container);
  }

  private drawPlaceholderFlower(
    container: Phaser.GameObjects.Container, flower: any,
    stemHeight: number, crownY: number, rarityColor: number
  ) {
    // Stem
    if (stemHeight > 0) {
      const stem = this.add.graphics();
      stem.fillStyle(0x43A047, 0.8);
      stem.fillRoundedRect(-2.5, crownY, 5, stemHeight, 3);
      container.add(stem);
    }

    // Leaves
    if (['GROWING', 'MATURE', 'BLOOMING'].includes(flower.stage)) {
      const leafColor = flower.stage === 'BLOOMING' ? 0x66BB6A : 0x43A047;
      const leaf = this.add.graphics();
      leaf.fillStyle(leafColor, 0.9);
      leaf.fillEllipse(-16, crownY + stemHeight * 0.4, 24, 10);
      leaf.fillEllipse(16, crownY + stemHeight * 0.45, 24, 10);
      container.add(leaf);
    }

    // Flower crown
    if (flower.stage === 'SEED') {
      const seed = this.add.graphics();
      seed.fillStyle(0x8D6E63, 1);
      seed.fillEllipse(0, crownY + 6, 12, 8);
      seed.fillStyle(0xA1887F, 0.5);
      seed.fillEllipse(0, crownY + 4, 8, 4);
      container.add(seed);
    } else {
      const crownSize = flower.stage === 'BLOOMING' ? 18 : flower.stage === 'MATURE' ? 13 : 9;
      const petals = this.add.graphics();
      for (let i = 0; i < 7; i++) {
        const angle = (i / 7) * Math.PI * 2;
        petals.fillStyle(rarityColor, 0.85);
        petals.fillEllipse(
          Math.cos(angle) * crownSize * 0.65,
          crownY + Math.sin(angle) * crownSize * 0.45,
          crownSize * 0.5, crownSize * 0.35
        );
      }
      container.add(petals);

      // Center
      const center = this.add.graphics();
      center.fillStyle(0xFFEE58, 1);
      center.fillCircle(0, crownY, crownSize * 0.28);
      container.add(center);

      // Rarity glow for non-N
      if (flower.rarity !== 'N') {
        const glow = this.add.graphics();
        glow.fillStyle(rarityColor, 0.2);
        glow.fillCircle(0, crownY - crownSize, crownSize * 1.2);
        container.add(glow);
      }
    }
  }

  private drawStageBadge(x: number, y: number, stage: string, cfg: typeof DEFAULT_STAGE): Phaser.GameObjects.Container {
    const badge = this.add.container(x, y);
    const gr = this.add.graphics();

    const bgWidth = 64;
    const bgHeight = 20;

    // Pulsing glow for BLOOMING/MATURE
    const [bg1, bg2] = cfg.labelBg;
    gr.fillGradientStyle(bg1, bg2, bg2, bg1, 0.92);
    gr.fillRoundedRect(-bgWidth / 2, -bgHeight / 2, bgWidth, bgHeight, 12);

    // White border
    gr.lineStyle(2, 0xFFFFFF, 0.8);
    gr.strokeRoundedRect(-bgWidth / 2, -bgHeight / 2, bgWidth, bgHeight, 12);

    badge.add(gr);

    const text = this.add.text(0, 0, cfg.label, {
      fontSize: '10px', color: cfg.labelColor, fontFamily: 'Nunito, Arial',
      fontStyle: 'bold', align: 'center',
    }).setOrigin(0.5);
    badge.add(text);

    // Breathing animation for BLOOMING
    if (stage === 'BLOOMING') {
      this.tweens.add({
        targets: badge,
        scaleX: 1.05, scaleY: 1.05,
        duration: 1200, yoyo: true, repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }

    return badge;
  }

  private setupBridgeListeners() {
    bridge.on(BridgeEvent.REFRESH_GARDEN, (slots: GardenSlot[]) => this.refreshSlots(slots));
    bridge.on(BridgeEvent.TOOL_ACTIVATED, (payload: { tool: 'seed' | 'glove' | 'knife' | null }) => {
      this.activeTool = payload.tool;
      if (payload.tool === 'knife') this.input.setDefaultCursor('crosshair');
      else if (payload.tool === 'glove') this.input.setDefaultCursor('pointer');
      else if (payload.tool === 'seed') this.input.setDefaultCursor('cell');
      else this.input.setDefaultCursor('default');
    });
  }
}
