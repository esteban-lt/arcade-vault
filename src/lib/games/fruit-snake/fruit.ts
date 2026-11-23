import { randomIntegerBetween } from "../shared/math";
import {
  BOARD_COLUMNS,
  BOARD_ROWS,
  CELL_SIZE_PIXELS,
  type Cell,
  type FruitKind,
} from "./constants";
import { fillEllipse, strokeStem } from "./skin-draw";
import type { FruitSnakeSkin } from "./skins";
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

export class Fruit {
  constructor(
    readonly cell: Cell,
    readonly kind: FruitKind,
  ) {}

  draw(context: CanvasRenderingContext2D, skin: FruitSnakeSkin): void {
    const centerX = this.cell.column * CELL_SIZE_PIXELS + CELL_SIZE_PIXELS / 2;
    const centerY = this.cell.row * CELL_SIZE_PIXELS + CELL_SIZE_PIXELS / 2;
    switch (this.kind) {
      case "apple":
        this.drawApple(context, skin, centerX, centerY);
        break;
      case "cherry":
        this.drawCherry(context, skin, centerX, centerY);
        break;
      case "lemon":
        fillEllipse(
          context, skin, centerX, centerY, LEMON_RADIUS_X_PIXELS, LEMON_RADIUS_Y_PIXELS, 0, skin.fruitColors.lemon,
        );
        break;
      case "grape":
        for (const offset of GRAPE_OFFSETS) {
          fillEllipse(
            context, skin, centerX + offset.x, centerY + offset.y,
            GRAPE_RADIUS_PIXELS, GRAPE_RADIUS_PIXELS, 0, skin.fruitColors.grape,
          );
        }
        break;
    }
  }

  private drawApple(context: CanvasRenderingContext2D, skin: FruitSnakeSkin, centerX: number, centerY: number): void {
    fillEllipse(
      context, skin, centerX, centerY, APPLE_RADIUS_PIXELS, APPLE_RADIUS_PIXELS, 0, skin.fruitColors.apple,
    );
    // Leaf on the top-right of the apple, tilted 45°.
    fillEllipse(
      context,
      skin,
      centerX + APPLE_LEAF_RADIUS_X_PIXELS,
      centerY - APPLE_RADIUS_PIXELS,
      APPLE_LEAF_RADIUS_X_PIXELS,
      APPLE_LEAF_RADIUS_Y_PIXELS,
      -Math.PI / 4,
      skin.fruitLeafColor,
    );
  }

  private drawCherry(context: CanvasRenderingContext2D, skin: FruitSnakeSkin, centerX: number, centerY: number): void {
    const cherryY = centerY + CHERRY_DROP_PIXELS;
    const halfSeparation = CHERRY_SEPARATION_PIXELS / 2;
    for (const side of [-1, 1]) {
      strokeStem(
        context, skin,
        centerX + side * halfSeparation, cherryY - CHERRY_RADIUS_PIXELS,
        centerX, centerY - CHERRY_STEM_JOIN_HEIGHT_PIXELS,
        CHERRY_STEM_WIDTH_PIXELS,
      );
    }
    for (const side of [-1, 1]) {
      fillEllipse(
        context, skin, centerX + side * halfSeparation, cherryY,
        CHERRY_RADIUS_PIXELS, CHERRY_RADIUS_PIXELS, 0, skin.fruitColors.cherry,
      );
    }
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
