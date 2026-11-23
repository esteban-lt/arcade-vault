import type { AsteroidsSkin } from "./skins";

export type Point = readonly [x: number, y: number];

// Rotates a point given relative to an origin and moves it to world coordinates.
export function toWorldPoint(local: Point, originX: number, originY: number, angle: number): Point {
  const cosine = Math.cos(angle);
  const sine = Math.sin(angle);
  return [originX + local[0] * cosine - local[1] * sine, originY + local[0] * sine + local[1] * cosine];
}

export function snapToGrid(value: number, gridSize: number): number {
  return Math.floor(value / gridSize) * gridSize;
}

// Strokes a polyline given in world coordinates. Pixelated skins paint it as grid blocks.
export function strokePath(
  context: CanvasRenderingContext2D,
  skin: AsteroidsSkin,
  points: readonly Point[],
  color: string,
  lineWidth: number,
  isClosed: boolean,
  dashPattern: readonly number[] = [],
): void {
  context.save();
  if (skin.glowBlurPixels > 0) {
    context.shadowColor = color;
    context.shadowBlur = skin.glowBlurPixels;
  }

  if (skin.isPixelated) {
    const block = skin.pixelSizePixels;
    context.fillStyle = color;
    const segmentCount = isClosed ? points.length : points.length - 1;
    for (let index = 0; index < segmentCount; index++) {
      const [startX, startY] = points[index];
      const [endX, endY] = points[(index + 1) % points.length];
      const steps = Math.max(1, Math.ceil(Math.hypot(endX - startX, endY - startY) / block));
      for (let step = 0; step <= steps; step++) {
        const ratio = step / steps;
        context.fillRect(
          snapToGrid(startX + (endX - startX) * ratio, block),
          snapToGrid(startY + (endY - startY) * ratio, block),
          block,
          block,
        );
      }
    }
  } else {
    context.strokeStyle = color;
    context.lineWidth = lineWidth;
    context.lineJoin = "round";
    context.setLineDash([...dashPattern]);
    context.beginPath();
    context.moveTo(points[0][0], points[0][1]);
    for (let index = 1; index < points.length; index++) context.lineTo(points[index][0], points[index][1]);
    if (isClosed) context.closePath();
    context.stroke();
  }
  context.restore();
}

// "bold 12px <family>", where the family may come from a CSS variable loaded by the app.
export function resolveFont(skin: AsteroidsSkin, weight: "bold" | "normal", sizePixels: number): string {
  let family = skin.fontFamily;
  if (skin.fontCssVariable !== null) {
    const resolved = getComputedStyle(document.documentElement).getPropertyValue(skin.fontCssVariable).trim();
    if (resolved) family = `${resolved}, ${skin.fontFamily}`;
  }
  return `${weight} ${sizePixels}px ${family}`;
}

// Drafting-paper grid under everything else; null blueprint = nothing drawn.
export function drawBlueprintGrid(context: CanvasRenderingContext2D, skin: AsteroidsSkin, width: number, height: number): void {
  const blueprint = skin.blueprint;
  if (!blueprint) return;
  context.save();
  context.lineWidth = 1;
  const columnCount = Math.floor(width / blueprint.gridSpacingPixels);
  const rowCount = Math.floor(height / blueprint.gridSpacingPixels);
  for (let column = 0; column <= columnCount; column++) {
    const x = column * blueprint.gridSpacingPixels + 0.5;
    context.strokeStyle = column % blueprint.majorGridEvery === 0 ? blueprint.majorGridColor : blueprint.gridColor;
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x, height);
    context.stroke();
  }
  for (let row = 0; row <= rowCount; row++) {
    const y = row * blueprint.gridSpacingPixels + 0.5;
    context.strokeStyle = row % blueprint.majorGridEvery === 0 ? blueprint.majorGridColor : blueprint.gridColor;
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(width, y);
    context.stroke();
  }
  context.restore();
}

// Thin dashed line from a point along an angle (ship heading / trajectory).
export function drawHeadingLine(
  context: CanvasRenderingContext2D,
  skin: AsteroidsSkin,
  startX: number,
  startY: number,
  angle: number,
): void {
  const blueprint = skin.blueprint;
  if (!blueprint) return;
  context.save();
  context.strokeStyle = blueprint.annotationColor;
  context.lineWidth = blueprint.annotationLineWidthPixels;
  context.setLineDash([...blueprint.headingDashPattern]);
  context.beginPath();
  context.moveTo(startX, startY);
  context.lineTo(startX + Math.cos(angle) * blueprint.headingLengthPixels, startY + Math.sin(angle) * blueprint.headingLengthPixels);
  context.stroke();
  context.restore();
}

// Center cross, plus (when hasDimension) a horizontal dimension line with end ticks under the rock.
export function drawDimensionMarks(
  context: CanvasRenderingContext2D,
  skin: AsteroidsSkin,
  centerX: number,
  centerY: number,
  radius: number,
  hasDimension: boolean,
): void {
  const blueprint = skin.blueprint;
  if (!blueprint) return;
  const arm = blueprint.dimensionMarkSizePixels;
  context.save();
  context.strokeStyle = blueprint.annotationColor;
  context.lineWidth = blueprint.annotationLineWidthPixels;
  context.beginPath();
  context.moveTo(centerX - arm, centerY);
  context.lineTo(centerX + arm, centerY);
  context.moveTo(centerX, centerY - arm);
  context.lineTo(centerX, centerY + arm);
  if (hasDimension) {
    const lineY = centerY + radius + arm * 2;
    context.moveTo(centerX - radius, lineY);
    context.lineTo(centerX + radius, lineY);
    context.moveTo(centerX - radius, lineY - arm);
    context.lineTo(centerX - radius, lineY + arm);
    context.moveTo(centerX + radius, lineY - arm);
    context.lineTo(centerX + radius, lineY + arm);
  }
  context.stroke();
  context.restore();
}
