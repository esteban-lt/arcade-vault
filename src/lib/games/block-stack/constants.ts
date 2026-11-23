// Values ported unchanged from references/started-games/03-tetris/game.js,
// except the "nut" piece (removed) and the key repeat (new: the original relied on OS auto-repeat).

export const GAME_KEY_CODES = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Space", "KeyX"] as const;
export const REPEATING_KEY_CODES = ["ArrowLeft", "ArrowRight", "ArrowDown"] as const;
export const INITIAL_LIVES = 1;

export const BOARD_COLUMNS = 10;
export const BOARD_ROWS = 20;
export const CELL_SIZE_PIXELS = 30;
export const BOARD_LEFT_PIXELS = 250; // (CANVAS_WIDTH − 10 × 30) / 2
export const BOARD_TOP_PIXELS = 0; // 20 × 30 = CANVAS_HEIGHT

export type PieceType = 1 | 2 | 3 | 4 | 5 | 6 | 7; // I, O, T, S, Z, J, L
export const PIECE_TYPES: readonly PieceType[] = [1, 2, 3, 4, 5, 6, 7];
export const PIECE_SHAPES: Readonly<Record<PieceType, readonly (readonly number[])[]>> = {
  1: [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]], // I
  2: [[2, 2], [2, 2]], // O
  3: [[0, 3, 0], [3, 3, 3], [0, 0, 0]], // T
  4: [[0, 4, 4], [4, 4, 0], [0, 0, 0]], // S
  5: [[5, 5, 0], [0, 5, 5], [0, 0, 0]], // Z
  6: [[6, 0, 0], [6, 6, 6], [0, 0, 0]], // J
  7: [[0, 0, 7], [7, 7, 7], [0, 0, 0]], // L
};
export const ROTATION_KICK_OFFSETS = [0, -1, 1, -2, 2] as const;

export const INITIAL_DROP_INTERVAL_SECONDS = 1;
export const DROP_INTERVAL_DECREASE_PER_LEVEL_SECONDS = 0.09;
export const MINIMUM_DROP_INTERVAL_SECONDS = 0.1;
export const LINES_PER_LEVEL = 10;

export const LINE_CLEAR_POINTS = [0, 100, 300, 500, 800] as const; // × level
export const SOFT_DROP_POINTS_PER_ROW = 1;
export const HARD_DROP_POINTS_PER_ROW = 2;

export const KEY_REPEAT_DELAY_SECONDS = 0.17;
export const KEY_REPEAT_INTERVAL_SECONDS = 0.05;

// Layout
export const NEXT_PREVIEW_SIZE_CELLS = 4; // 4 × 30 = 120 px box
