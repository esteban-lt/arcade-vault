import { CANVAS_HEIGHT, CANVAS_WIDTH } from "../shared/canvas";
import { CELL_SIZE_PIXELS } from "./constants";
import type { FruitSnakeSkin } from "./skins";

function applyGlow(context: CanvasRenderingContext2D, skin: FruitSnakeSkin, color: string): void {
  if (skin.glowBlurPixels <= 0) return;
  context.shadowColor = color;
  context.shadowBlur = skin.glowBlurPixels;
}

function snapToBlock(value: number, block: number): number {
  return Math.floor(value / block) * block;
}

// Background, grid lines and (per skin) the board setup shared by every frame.
export function drawBoard(context: CanvasRenderingContext2D, skin: FruitSnakeSkin): void {
  context.imageSmoothingEnabled = !skin.isPixelated;
  context.fillStyle = skin.backgroundColor;
  context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  context.fillStyle = skin.gridLineColor;
  for (let x = CELL_SIZE_PIXELS; x < CANVAS_WIDTH; x += CELL_SIZE_PIXELS) {
    context.fillRect(x, 0, 1, CANVAS_HEIGHT);
  }
  for (let y = CELL_SIZE_PIXELS; y < CANVAS_HEIGHT; y += CELL_SIZE_PIXELS) {
    context.fillRect(0, y, CANVAS_WIDTH, 1);
  }
}

function paintEllipse(
  context: CanvasRenderingContext2D,
  skin: FruitSnakeSkin,
  centerX: number,
  centerY: number,
  radiusX: number,
  radiusY: number,
  rotation: number,
  color: string,
): void {
  context.fillStyle = color;
  if (!skin.isPixelated) {
    context.beginPath();
    context.ellipse(centerX, centerY, radiusX, radiusY, rotation, 0, Math.PI * 2);
    context.fill();
    return;
  }
  // Pixelated: fill every grid block whose center falls inside the (rotated) ellipse.
  const block = skin.pixelSizePixels;
  const extent = Math.max(radiusX, radiusY) + block;
  const cosine = Math.cos(rotation);
  const sine = Math.sin(rotation);
  for (let blockY = snapToBlock(centerY - extent, block); blockY < centerY + extent; blockY += block) {
    for (let blockX = snapToBlock(centerX - extent, block); blockX < centerX + extent; blockX += block) {
      const offsetX = blockX + block / 2 - centerX;
      const offsetY = blockY + block / 2 - centerY;
      const along = offsetX * cosine + offsetY * sine;
      const across = -offsetX * sine + offsetY * cosine;
      if ((along / radiusX) ** 2 + (across / radiusY) ** 2 <= 1) context.fillRect(blockX, blockY, block, block);
    }
  }
}

// A filled ellipse (a circle when both radii match), styled by the skin: glow, hard shadow, ink outline or blocks.
export function fillEllipse(
  context: CanvasRenderingContext2D,
  skin: FruitSnakeSkin,
  centerX: number,
  centerY: number,
  radiusX: number,
  radiusY: number,
  rotation: number,
  color: string,
): void {
  context.save();
  if (skin.shadowColor !== null && skin.shadowOffsetPixels > 0) {
    paintEllipse(
      context, skin, centerX + skin.shadowOffsetPixels, centerY + skin.shadowOffsetPixels,
      radiusX, radiusY, rotation, skin.shadowColor,
    );
  }
  applyGlow(context, skin, color);
  paintEllipse(context, skin, centerX, centerY, radiusX, radiusY, rotation, color);
  context.shadowBlur = 0;
  if (skin.outlineColor !== null && !skin.isPixelated) {
    context.strokeStyle = skin.outlineColor;
    context.lineWidth = skin.outlineWidthPixels;
    context.stroke();
  }
  context.restore();
}

// A straight stem. Pixelated skins paint it as grid blocks.
export function strokeStem(
  context: CanvasRenderingContext2D,
  skin: FruitSnakeSkin,
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  lineWidth: number,
): void {
  context.save();
  applyGlow(context, skin, skin.fruitStemColor);
  if (skin.isPixelated) {
    const block = skin.pixelSizePixels;
    context.fillStyle = skin.fruitStemColor;
    const steps = Math.max(1, Math.ceil(Math.hypot(endX - startX, endY - startY) / block));
    for (let step = 0; step <= steps; step++) {
      const ratio = step / steps;
      context.fillRect(
        snapToBlock(startX + (endX - startX) * ratio, block),
        snapToBlock(startY + (endY - startY) * ratio, block),
        block,
        block,
      );
    }
  } else {
    context.strokeStyle = skin.fruitStemColor;
    context.lineWidth = lineWidth;
    context.beginPath();
    context.moveTo(startX, startY);
    context.lineTo(endX, endY);
    context.stroke();
  }
  context.restore();
}

// One snake segment given by the top-left corner and side of its square.
export function drawSegment(
  context: CanvasRenderingContext2D,
  skin: FruitSnakeSkin,
  x: number,
  y: number,
  size: number,
  color: string,
): void {
  context.save();
  switch (skin.segmentStyle) {
    case "flat":
      applyGlow(context, skin, color);
      context.fillStyle = color;
      context.fillRect(x, y, size, size);
      break;
    case "outline": {
      const width = skin.segmentOutlineWidthPixels;
      applyGlow(context, skin, color);
      context.globalAlpha = 0.35;
      context.fillStyle = color;
      context.fillRect(x, y, size, size);
      context.globalAlpha = 1;
      context.strokeStyle = color;
      context.lineWidth = width;
      context.strokeRect(x + width / 2, y + width / 2, size - width, size - width);
      break;
    }
    case "pixel": {
      const band = skin.pixelSizePixels;
      context.fillStyle = color;
      context.fillRect(x, y, size, size);
      if (skin.highlightColor !== null) {
        context.fillStyle = skin.highlightColor;
        context.fillRect(x, y, size, band);
        context.fillRect(x, y, band, size);
      }
      if (skin.shadeColor !== null) {
        context.fillStyle = skin.shadeColor;
        context.fillRect(x, y + size - band, size, band);
        context.fillRect(x + size - band, y, band, size);
      }
      break;
    }
    case "sticker":
      if (skin.shadowColor !== null && skin.shadowOffsetPixels > 0) {
        context.fillStyle = skin.shadowColor;
        context.beginPath();
        context.roundRect(
          x + skin.shadowOffsetPixels, y + skin.shadowOffsetPixels, size, size, skin.segmentCornerRadiusPixels,
        );
        context.fill();
      }
      context.fillStyle = color;
      context.beginPath();
      context.roundRect(x, y, size, size, skin.segmentCornerRadiusPixels);
      context.fill();
      if (skin.outlineColor !== null) {
        context.strokeStyle = skin.outlineColor;
        context.lineWidth = skin.outlineWidthPixels;
        context.stroke();
      }
      break;
  }
  context.restore();
}
