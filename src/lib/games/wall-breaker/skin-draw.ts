import { CANVAS_HEIGHT, CANVAS_WIDTH } from "../shared/canvas";
import type { BlockPattern, SynthwaveScene, WallBreakerSkin } from "./skins";

const GRID_HORIZONTAL_LINE_COUNT = 8;
const GRID_VERTICAL_LINE_HALF_COUNT = 9;
const GRID_VERTICAL_LINE_SPACING_PIXELS = 100;
const SUN_BAND_COUNT = 5;

// Integer coordinates in pixelated skins; unchanged otherwise.
export function snap(skin: WallBreakerSkin, value: number): number {
  return skin.isPixelated ? Math.round(value) : value;
}

export function applySmoothing(context: CanvasRenderingContext2D, skin: WallBreakerSkin): void {
  context.imageSmoothingEnabled = !skin.isPixelated;
}

export function setGlow(context: CanvasRenderingContext2D, color: string, blurPixels: number): void {
  context.shadowColor = color;
  context.shadowBlur = blurPixels;
}

export function clearGlow(context: CanvasRenderingContext2D): void {
  context.shadowBlur = 0;
  context.shadowColor = "transparent";
}

export function drawBackground(context: CanvasRenderingContext2D, skin: WallBreakerSkin, timeSeconds: number): void {
  context.fillStyle = skin.backgroundColor;
  context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  if (skin.scene) drawSynthwaveScene(context, skin.scene, timeSeconds);
}

function drawSynthwaveScene(context: CanvasRenderingContext2D, scene: SynthwaveScene, timeSeconds: number): void {
  const horizonY = scene.horizonYPixels;
  const centerX = CANVAS_WIDTH / 2;

  const sky = context.createLinearGradient(0, 0, 0, horizonY);
  for (const [offset, color] of scene.skyStops) sky.addColorStop(offset, color);
  context.fillStyle = sky;
  context.fillRect(0, 0, CANVAS_WIDTH, horizonY);

  // Sun: upper half disc with horizontal bands cut out, thicker towards the horizon.
  context.save();
  context.beginPath();
  context.rect(0, 0, CANVAS_WIDTH, horizonY);
  context.clip();
  const sun = context.createLinearGradient(0, horizonY - scene.sunRadiusPixels, 0, horizonY);
  sun.addColorStop(0, scene.sunTopColor);
  sun.addColorStop(1, scene.sunBottomColor);
  context.fillStyle = sun;
  context.beginPath();
  context.arc(centerX, horizonY, scene.sunRadiusPixels, Math.PI, Math.PI * 2);
  context.fill();
  context.fillStyle = scene.sunBandColor;
  for (let band = 0; band < SUN_BAND_COUNT; band++) {
    const thickness = 2 + (SUN_BAND_COUNT - 1 - band) * 1.5;
    context.fillRect(centerX - scene.sunRadiusPixels, horizonY - 8 - band * 16 - thickness, scene.sunRadiusPixels * 2, thickness);
  }
  context.restore();

  // Floor.
  const floorHeight = CANVAS_HEIGHT - horizonY;
  const floor = context.createLinearGradient(0, horizonY, 0, CANVAS_HEIGHT);
  floor.addColorStop(0, scene.floorTopColor);
  floor.addColorStop(1, scene.floorBottomColor);
  context.fillStyle = floor;
  context.fillRect(0, horizonY, CANVAS_WIDTH, floorHeight);

  // Perspective grid: vertical lines converge on the horizon, horizontal ones scroll towards the viewer.
  context.strokeStyle = scene.gridColor;
  context.lineWidth = 1;
  context.globalAlpha = 0.45;
  context.beginPath();
  for (let index = -GRID_VERTICAL_LINE_HALF_COUNT; index <= GRID_VERTICAL_LINE_HALF_COUNT; index++) {
    context.moveTo(centerX, horizonY);
    context.lineTo(centerX + index * GRID_VERTICAL_LINE_SPACING_PIXELS, CANVAS_HEIGHT);
  }
  context.stroke();
  const phase = (timeSeconds * scene.gridScrollCyclesPerSecond) % 1;
  for (let line = 0; line < GRID_HORIZONTAL_LINE_COUNT; line++) {
    const depth = (line + phase) / GRID_HORIZONTAL_LINE_COUNT;
    context.globalAlpha = 0.25 + depth * 0.55;
    context.lineWidth = 1 + depth * 1.5;
    const y = horizonY + floorHeight * depth * depth;
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(CANVAS_WIDTH, y);
    context.stroke();
  }
  context.globalAlpha = 1;
}

// Block body in the skin's pattern (solid or outline).
export function drawBlockBody(
  context: CanvasRenderingContext2D,
  skin: WallBreakerSkin,
  pattern: BlockPattern,
  color: string,
  x: number,
  y: number,
  width: number,
  height: number,
): void {
  if (pattern === "outline") {
    const line = skin.blockOutlineWidthPixels;
    context.save();
    context.globalAlpha = skin.blockOutlineFillAlpha;
    context.fillStyle = color;
    context.fillRect(x, y, width, height);
    context.restore();
    context.strokeStyle = color;
    context.lineWidth = line;
    context.strokeRect(x + line / 2, y + line / 2, width - line, height - line);
    return;
  }

  context.fillStyle = color;
  context.fillRect(x, y, width, height);
  if (skin.blockHighlightHeightPixels > 0) {
    context.fillStyle = skin.blockHighlightColor;
    context.fillRect(x, y, width, skin.blockHighlightHeightPixels);
  }
  if (skin.blockShadeHeightPixels > 0) {
    context.fillStyle = skin.blockShadeColor;
    context.fillRect(x, y + height - skin.blockShadeHeightPixels, width, skin.blockShadeHeightPixels);
  }
}
