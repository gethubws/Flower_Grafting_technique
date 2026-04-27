import Phaser from 'phaser';
import { PlaceholderFlower } from '../objects/PlaceholderFlower';
import type { GardenSlot, Flower } from '../../../types';
import { bridge, BridgeEvent } from '../../bridge';

const COLS = 3;
const ROWS = 2;
const SLOT_W = 200;
const SLOT_H = 250;
const GRID_X = 100;
const GRID_Y = 50;
const GAP_X = 20;
const GAP_Y = 20;

export class GardenScene extends Phaser.Scene {
  private slotZones: Phaser.GameObjects.Zone[] = [];
  private flowerObjects: Map<number, PlaceholderFlower> = new Map();
  private slots: GardenSlot[] = [];
  private slotHighlights: Phaser.GameObjects.Graphics[] = [];

  // Drag state
  private dragSource: number | null = null;
  private dragGhost: Phaser.GameObjects.Graphics | null = null;

  constructor() {
    super({ key: 'GardenScene' });
  }

  create() {
    this.drawGrid();
    this.setupBridgeListeners();
  }

  // ========================
  // Grid Drawing
  // ========================

  private drawGrid() {
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const pos = row * COLS + col;
        const x = GRID_X + col * (SLOT_W + GAP_X) + SLOT_W / 2;
        const y = GRID_Y + row * (SLOT_H + GAP_Y) + SLOT_H / 2;

        // Slot background
        const bg = this.add.graphics();
        bg.fillStyle(0x16213e, 0.6);
        bg.fillRoundedRect(x - SLOT_W / 2, y - SLOT_H / 2, SLOT_W, SLOT_H, 12);
        bg.lineStyle(1.5, 0x0f3460, 0.8);
        bg.strokeRoundedRect(x - SLOT_W / 2, y - SLOT_H / 2, SLOT_W, SLOT_H, 12);

        // Position label
        this.add
          .text(x, y - SLOT_H / 2 + 10, `槽位 ${pos + 1}`, {
            fontSize: '11px',
            color: '#334466',
            fontFamily: 'monospace',
          })
          .setOrigin(0.5, 0);

        // Interactive zone
        const zone = this.add
          .zone(x, y, SLOT_W, SLOT_H)
          .setInteractive({ useHandCursor: true })
          .setData('position', pos);

        zone.on('pointerdown', () => this.onSlotClick(pos));
        zone.on('pointerover', () => this.highlightSlot(pos, true));
        zone.on('pointerout', () => this.highlightSlot(pos, false));

        // Drag support
        this.input.setDraggable(zone);
        zone.on('dragstart', (_p: Phaser.Input.Pointer) => this.onDragStart(pos, _p));
        zone.on('drag', (_p: Phaser.Input.Pointer, dx: number, dy: number) => {
          if (this.dragGhost) {
            this.dragGhost.setPosition(this.dragGhost.x + dx, this.dragGhost.y + dy);
          }
        });
        zone.on('dragend', () => this.onDragEnd());

        this.slotZones.push(zone);

        // Highlight overlay
        const hl = this.add.graphics();
        hl.setVisible(false);
        this.slotHighlights.push(hl);
      }
    }
  }

  // ========================
  // Slot Rendering
  // ========================

  refreshSlots(slots: GardenSlot[]) {
    this.slots = slots;
    // Clear old
    this.flowerObjects.forEach((f) => f.destroy());
    this.flowerObjects.clear();

    for (const slot of slots) {
      if (slot.flower) {
        const { x, y } = this.getSlotCenter(slot.position);
        const flowerObj = new PlaceholderFlower(
          this,
          x,
          y + 30, // offset for pot alignment within slot
          slot.flower.rarity,
          slot.flower.stage,
          slot.flower.name,
        );
        flowerObj.setDepth(10);
        this.flowerObjects.set(slot.position, flowerObj);
      }
    }
  }

  private getSlotCenter(position: number): { x: number; y: number } {
    const row = Math.floor(position / COLS);
    const col = position % COLS;
    return {
      x: GRID_X + col * (SLOT_W + GAP_X) + SLOT_W / 2,
      y: GRID_Y + row * (SLOT_H + GAP_Y) + SLOT_H / 2,
    };
  }

  // ========================
  // Interactions
  // ========================

  private onSlotClick(pos: number) {
    const slot = this.slots.find((s) => s.position === pos);
    if (slot?.flower) {
      bridge.emit(BridgeEvent.SLOT_CLICKED, {
        position: pos,
        flower: slot.flower,
      });
    } else {
      bridge.emit(BridgeEvent.SLOT_CLICKED, { position: pos, flower: null });
    }
  }

  private highlightSlot(pos: number, on: boolean) {
    const hl = this.slotHighlights[pos];
    if (!hl) return;
    hl.clear();
    hl.setVisible(on);
    if (on) {
      const { x, y } = this.getSlotCenter(pos);
      hl.fillStyle(0x4488ff, 0.1);
      hl.fillRoundedRect(x - SLOT_W / 2, y - SLOT_H / 2, SLOT_W, SLOT_H, 12);
      hl.lineStyle(2, 0x4488ff, 0.6);
      hl.strokeRoundedRect(x - SLOT_W / 2, y - SLOT_H / 2, SLOT_W, SLOT_H, 12);
    }
  }

  private onDragStart(pos: number, pointer: Phaser.Input.Pointer) {
    const slot = this.slots.find((s) => s.position === pos);
    if (!slot?.flower) return;

    this.dragSource = pos;
    this.dragGhost = this.add.graphics();
    this.dragGhost.fillStyle(0x4488ff, 0.3);
    const { x, y } = pointer;
    this.dragGhost.fillCircle(x, y, 20);
    this.dragGhost.setDepth(100);
  }

  private onDragEnd() {
    if (this.dragGhost) {
      this.dragGhost.destroy();
      this.dragGhost = null;
    }
    if (this.dragSource !== null) {
      const flower = this.slots.find((s) => s.position === this.dragSource)?.flower;
      if (flower) {
        bridge.emit(BridgeEvent.FLOWER_DRAGGED, {
          flowerId: flower.id,
          position: this.dragSource,
        });
      }
      this.dragSource = null;
    }
  }

  // ========================
  // Bridge Events
  // ========================

  private setupBridgeListeners() {
    bridge.on(BridgeEvent.REFRESH_GARDEN, (slots: GardenSlot[]) => {
      this.refreshSlots(slots);
    });

    bridge.on(BridgeEvent.FUSION_RESULT, (data: { position: number; flower: Flower }) => {
      // Show result in the specified slot
      this.showFusionResult(data.position, data.flower);
    });
  }

  private showFusionResult(position: number, flower: Flower) {
    const { x, y } = this.getSlotCenter(position);
    // Brief flash effect
    const flash = this.add.graphics();
    flash.fillStyle(0xffaa00, 0.5);
    flash.fillCircle(x, y, 60);
    flash.setDepth(50);
    this.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 800,
      onComplete: () => flash.destroy(),
    });

    const obj = new PlaceholderFlower(this, x, y + 30, flower.rarity, flower.stage, flower.name);
    obj.setDepth(10);
    this.flowerObjects.set(position, obj);
  }
}
