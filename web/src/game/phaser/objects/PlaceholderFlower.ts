import Phaser from 'phaser';

// Rarity → color
const RARITY_COLORS: Record<string, number> = {
  N: 0x808080,
  R: 0x4488ff,
  SR: 0xaa44ff,
  SSR: 0xffaa00,
  UR: 0xff3333,
};

// Stage → pixel size of flower crown
const STAGE_SIZES: Record<string, number> = {
  SEED: 16,
  SEEDLING: 32,
  GROWING: 48,
  MATURE: 56,
  BLOOMING: 64,
  RECOVERING: 32,
};

const STAGE_COLORS: Record<string, number> = {
  SEED: 0x2d5a1e,
  SEEDLING: 0x5a8f3c,
  GROWING: 0x4488ff,
  MATURE: 0x8844cc,
  BLOOMING: 0xffaa00,
  RECOVERING: 0x663333,
};

/**
 * L1 几何占位花 — 纯 Phaser Graphics 绘制
 */
export class PlaceholderFlower {
  private graphics: Phaser.GameObjects.Graphics;
  private label: Phaser.GameObjects.Text;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    rarity: string,
    stage: string,
    name?: string | null,
  ) {
    const crownSize = STAGE_SIZES[stage] || 32;
    const crownColor = RARITY_COLORS[rarity] || 0x808080;
    const stageColor = STAGE_COLORS[stage] || 0x808080;

    this.graphics = scene.add.graphics();

    // Pot (bottom-aligned)
    const potW = crownSize * 0.9;
    const potH = crownSize * 0.7;
    const potTop = y;
    this.graphics.fillStyle(0x8B6914, 1);
    this.graphics.fillRect(x - potW / 2, potTop, potW, potH);
    this.graphics.lineStyle(1.5, 0x6B4F12, 1);
    this.graphics.strokeRect(x - potW / 2, potTop, potW, potH);
    // Pot rim
    this.graphics.fillStyle(0xA0782C, 1);
    this.graphics.fillRect(x - potW / 2 - 3, potTop, potW + 6, potH * 0.15);

    // Stem
    const stemTop = potTop - crownSize * 0.8;
    this.graphics.lineStyle(crownSize * 0.08, 0x4A7C3F, 1);
    this.graphics.lineBetween(x, potTop, x, stemTop);

    // Crown (ellipse is approximated by a scaled circle)
    const crownW = crownSize * 0.7;
    const crownH = crownSize * 0.5;
    this.graphics.fillStyle(crownColor, 0.85);
    this.graphics.fillEllipse(x, stemTop, crownW, crownH);
    this.graphics.lineStyle(1, 0x000000, 0.3);
    this.graphics.strokeEllipse(x, stemTop, crownW, crownH);

    // Center stamen
    const stamenR = crownSize * 0.12;
    this.graphics.fillStyle(0xFFD700, 1);
    this.graphics.fillCircle(x, stemTop, stamenR);

    // Recovering overlay
    if (stage === 'RECOVERING') {
      this.graphics.fillStyle(0x000000, 0.4);
      this.graphics.fillRect(x - crownSize, y - crownSize * 2, crownSize * 2, crownSize * 3);
    }

    // Rarity badge (top-right of the flower)
    const bSize = 14;
    const bx = x + crownW / 2 - bSize / 2;
    const by = stemTop - crownH / 2 - bSize;
    this.graphics.fillStyle(crownColor, 0.9);
    this.graphics.fillCircle(bx + bSize / 2, by + bSize / 2, bSize / 2);
    this.graphics.lineStyle(1, 0xffffff, 0.5);
    this.graphics.strokeCircle(bx + bSize / 2, by + bSize / 2, bSize / 2);

    // Name label (below pot)
    this.label = scene.add.text(x, potTop + potH + 6, '', {
      fontSize: '11px',
      fontFamily: 'monospace',
      color: '#aaa',
      align: 'center',
    });
    this.label.setOrigin(0.5, 0);
    this.updateLabel(name, rarity, stage);
  }

  private updateLabel(name?: string | null, rarity?: string, stage?: string) {
    const shortName = name ? name.replace('种子', '').slice(0, 8) : '';
    this.label.setText(`${shortName}${rarity ? ' ' + rarity : ''}`);
  }

  setPosition(x: number, y: number) {
    // PlaceholderFlower is drawn relative to (x,y), re-instantiate on refresh
  }

  destroy() {
    this.graphics.destroy();
    this.label.destroy();
  }

  setDepth(d: number) {
    this.graphics.setDepth(d);
    this.label.setDepth(d);
  }
}
