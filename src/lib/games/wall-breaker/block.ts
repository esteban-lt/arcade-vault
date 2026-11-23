import {
  BLOCK_HEIGHT_PIXELS,
  BLOCK_WIDTH_PIXELS,
  BLOCKS_ORIGIN_LEFT_PIXELS,
  BLOCKS_ORIGIN_TOP_PIXELS,
  EXPLOSION_DURATION_SECONDS,
  EXPLOSION_FRAME_ALPHAS,
  EXPLOSION_FRAME_SCALES,
  type BlockColor,
} from "./constants";
import type { LevelDefinition } from "./levels";
import { clearGlow, drawBlockBody, setGlow, snap } from "./skin-draw";
import type { WallBreakerSkin } from "./skins";

export type Rectangle = { x: number; y: number; width: number; height: number };

// Axis-aligned overlap with strict edges, as collideAABB in the original.
export function rectanglesOverlap(first: Rectangle, second: Rectangle): boolean {
  return (
    first.x < second.x + second.width &&
    first.x + first.width > second.x &&
    first.y < second.y + second.height &&
    first.y + first.height > second.y
  );
}

export class Block {
  readonly x: number;
  readonly y: number;
  readonly width = BLOCK_WIDTH_PIXELS;
  readonly height = BLOCK_HEIGHT_PIXELS;
  readonly color: BlockColor;
  isDestroyed = false;

  constructor(column: number, row: number, color: BlockColor) {
    this.x = BLOCKS_ORIGIN_LEFT_PIXELS + column * BLOCK_WIDTH_PIXELS;
    this.y = BLOCKS_ORIGIN_TOP_PIXELS + row * BLOCK_HEIGHT_PIXELS;
    this.color = color;
  }

  draw(context: CanvasRenderingContext2D, skin: WallBreakerSkin): void {
    const inset = skin.blockInsetPixels;
    const x = this.x + inset;
    const y = this.y + inset;
    const width = this.width - inset * 2;
    const height = this.height - inset * 2;
    const color = skin.blockColors[this.color];
    if (skin.blockGlowBlurPixels > 0) setGlow(context, color, skin.blockGlowBlurPixels);
    drawBlockBody(context, skin, skin.blockPatterns[this.color], color, x, y, width, height);
    clearGlow(context);
  }
}

// Blocks of a level, in the order of its definition (that order decides which block breaks first).
export function createLevelBlocks(level: LevelDefinition): Block[] {
  return level.blocks.map(({ column, row, color }) => new Block(column, row, color));
}

// Four frames over EXPLOSION_DURATION_SECONDS: the block shrinks towards its center and fades out.
export class Explosion {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly color: BlockColor;
  elapsedSeconds = 0;
  isDead = false;

  constructor(block: Block) {
    this.x = block.x;
    this.y = block.y;
    this.width = block.width;
    this.height = block.height;
    this.color = block.color;
  }

  update(deltaSeconds: number): void {
    this.elapsedSeconds += deltaSeconds;
    if (this.elapsedSeconds >= EXPLOSION_DURATION_SECONDS) this.isDead = true;
  }

  draw(context: CanvasRenderingContext2D, skin: WallBreakerSkin): void {
    const frameCount = EXPLOSION_FRAME_ALPHAS.length;
    const frameIndex = Math.min(
      Math.floor((this.elapsedSeconds / EXPLOSION_DURATION_SECONDS) * frameCount),
      frameCount - 1,
    );
    const scale = EXPLOSION_FRAME_SCALES[frameIndex];
    const width = this.width * scale;
    const height = this.height * scale;
    context.save();
    context.globalAlpha = EXPLOSION_FRAME_ALPHAS[frameIndex];
    context.fillStyle = skin.blockColors[this.color];
    context.fillRect(
      snap(skin, this.x + (this.width - width) / 2),
      snap(skin, this.y + (this.height - height) / 2),
      snap(skin, width),
      snap(skin, height),
    );
    context.restore();
  }
}
