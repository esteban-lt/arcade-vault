// Starting balance values defined in specs/09-fruit-snake-game.md (game designed from scratch).

export type Direction = "up" | "down" | "left" | "right";
export type FruitKind = "apple" | "cherry" | "lemon" | "grape";
export type Cell = { column: number; row: number };

export const GAME_KEY_CODES = [
  "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight",
  "KeyW", "KeyS", "KeyA", "KeyD",
] as const;
export const INITIAL_LIVES = 1;

export const BOARD_COLUMNS = 40;
export const BOARD_ROWS = 30;
export const CELL_SIZE_PIXELS = 20; // 40 × 20 = 800, 30 × 20 = 600

export const INITIAL_SNAKE_HEAD_COLUMN = 20;
export const INITIAL_SNAKE_HEAD_ROW = 15;
export const INITIAL_SNAKE_LENGTH = 3; // head + 2 segments to its left
export const INITIAL_DIRECTION: Direction = "right";

export const INITIAL_STEP_INTERVAL_SECONDS = 0.12;
export const STEP_INTERVAL_DECREMENT_PER_LEVEL_SECONDS = 0.01;
export const MINIMUM_STEP_INTERVAL_SECONDS = 0.05;
export const MAXIMUM_QUEUED_TURNS = 2;

export const FRUITS_PER_LEVEL = 5;
export const POINTS_PER_FRUIT_PER_LEVEL = 10;

// Drawing layout (colors and styles live in skins.ts)
export const SNAKE_SEGMENT_INSET_PIXELS = 1; // segments are drawn 18×18 inside their cell
export const SNAKE_EYE_SIZE_PIXELS = 3;
