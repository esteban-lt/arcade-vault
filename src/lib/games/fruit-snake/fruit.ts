import { randomIntegerBetween } from "../shared/math";
import {
  BOARD_COLUMNS,
  BOARD_ROWS,
  CELL_SIZE_PIXELS,
  FRUIT_COLORS,
  FRUIT_LEAF_COLOR,
  FRUIT_STEM_COLOR,
  type Cell,
  type FruitKind,
} from "./constants";
import type { Snake } from "./snake";

const FRUIT_KINDS: readonly FruitKind[] = ["apple", "cherry", "lemon", "grape"];

const APPLE_RADIUS_PIXELS = 8;
const APPLE_LEAF_RADIUS_X_PIXELS = 4;
const APPLE_LEAF_RADIUS_Y_PIXELS = 2;
const CHERRY_RADIUS_PIXELS = 5;
const CHERRY_SEPARATION_PIXELS = 8; // between the centers of both cherries
const CHERRY_DROP_PIXELS = 3; // cherries sit below the cell center
const CHERRY_STEM_JOIN_HEIGHT_PIXELS = 8; // stems meet above the cell center
const CHERRY_STEM_WIDTH_PIXELS = 1.5;
const LEMON_RADIUS_X_PIXELS = 9;
const LEMON_RADIUS_Y_PIXELS = 7;
const GRAPE_RADIUS_PIXELS = 3.5;
// Grape centers relative to the cell center: rows of 3, 2 and 1, pointing down.
const GRAPE_OFFSETS: readonly { x: number; y: number }[] = [
  { x: -7, y: -6 }, { x: 0, y: -6 }, { x: 7, y: -6 },
  { x: -3.5, y: 0 }, { x: 3.5, y: 0 },
  { x: 0, y: 6 },
];

function fillCircle(context: CanvasRenderingContext2D, x: number, y: number, radius: number): void {
  context.beginPath();
  context.arc(x, y, radius, 0, Math.PI * 2);
  context.fill();
}

export class Fruit {
  constructor(
    readonly cell: Cell,
    readonly kind: FruitKind,
  ) {}

  draw(context: CanvasRenderingContext2D): void {
    const centerX = this.cell.column * CELL_SIZE_PIXELS + CELL_SIZE_PIXELS / 2;
    const centerY = this.cell.row * CELL_SIZE_PIXELS + CELL_SIZE_PIXELS / 2;
    switch (this.kind) {
      case "apple":
        this.drawApple(context, centerX, centerY);
        break;
      case "cherry":
        this.drawCherry(context, centerX, centerY);
        break;
      case "lemon":
        context.fillStyle = FRUIT_COLORS.lemon;
        context.beginPath();
        context.ellipse(centerX, centerY, LEMON_RADIUS_X_PIXELS, LEMON_RADIUS_Y_PIXELS, 0, 0, Math.PI * 2);
        context.fill();
        break;
      case "grape":
        context.fillStyle = FRUIT_COLORS.grape;
        for (const offset of GRAPE_OFFSETS) fillCircle(context, centerX + offset.x, centerY + offset.y, GRAPE_RADIUS_PIXELS);
        break;
    }
  }

  private drawApple(context: CanvasRenderingContext2D, centerX: number, centerY: number): void {
    context.fillStyle = FRUIT_COLORS.apple;
    fillCircle(context, centerX, centerY, APPLE_RADIUS_PIXELS);
    // Leaf on the top-right of the apple, tilted 45°.
    context.fillStyle = FRUIT_LEAF_COLOR;
    context.beginPath();
    context.ellipse(
      centerX + APPLE_LEAF_RADIUS_X_PIXELS,
      centerY - APPLE_RADIUS_PIXELS,
      APPLE_LEAF_RADIUS_X_PIXELS,
      APPLE_LEAF_RADIUS_Y_PIXELS,
      -Math.PI / 4,
      0,
      Math.PI * 2,
    );
    context.fill();
  }

  private drawCherry(context: CanvasRenderingContext2D, centerX: number, centerY: number): void {
    const cherryY = centerY + CHERRY_DROP_PIXELS;
    const halfSeparation = CHERRY_SEPARATION_PIXELS / 2;
    context.strokeStyle = FRUIT_STEM_COLOR;
    context.lineWidth = CHERRY_STEM_WIDTH_PIXELS;
    context.beginPath();
    for (const side of [-1, 1]) {
      context.moveTo(centerX + side * halfSeparation, cherryY - CHERRY_RADIUS_PIXELS);
      context.lineTo(centerX, centerY - CHERRY_STEM_JOIN_HEIGHT_PIXELS);
    }
    context.stroke();
    context.fillStyle = FRUIT_COLORS.cherry;
    for (const side of [-1, 1]) fillCircle(context, centerX + side * halfSeparation, cherryY, CHERRY_RADIUS_PIXELS);
  }
}

// Uniform over the cells the snake does not occupy; null when the board is full.
export function spawnFruit(snake: Snake): Fruit | null {
  const freeCells: Cell[] = [];
  for (let row = 0; row < BOARD_ROWS; row++) {
    for (let column = 0; column < BOARD_COLUMNS; column++) {
      const cell = { column, row };
      if (!snake.occupies(cell)) freeCells.push(cell);
    }
  }
  if (freeCells.length === 0) return null;
  const cell = freeCells[randomIntegerBetween(0, freeCells.length - 1)];
  const kind = FRUIT_KINDS[randomIntegerBetween(0, FRUIT_KINDS.length - 1)];
  return new Fruit(cell, kind);
}
