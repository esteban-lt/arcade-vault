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
export const PIECE_COLORS: Readonly<Record<PieceType, string>> = {
  1: "#4dd0e1",
  2: "#ffd54f",
  3: "#ba68c8",
  4: "#81c784",
  5: "#e57373",
  6: "#90caf9",
  7: "#ffb74d",
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

// Drawing (dark theme of style.css)
export const BOARD_BACKGROUND_COLOR = "#1a1a25";
export const BOARD_BORDER_COLOR = "#2a2a3a";
export const GRID_LINE_COLOR = "#22222e";
export const GRID_LINE_WIDTH_PIXELS = 0.5;
export const BLOCK_INSET_PIXELS = 1;
export const BLOCK_HIGHLIGHT_HEIGHT_PIXELS = 4;
export const BLOCK_HIGHLIGHT_COLOR = "rgba(255,255,255,0.12)";
export const GHOST_PIECE_ALPHA = 0.2;
export const PANEL_LABEL_COLOR = "#555570";
export const PANEL_VALUE_COLOR = "#7aa2f7";
export const PANEL_TEXT_COLOR = "#888888";
export const NEXT_PREVIEW_SIZE_CELLS = 4; // 4 × 30 = 120 px box
