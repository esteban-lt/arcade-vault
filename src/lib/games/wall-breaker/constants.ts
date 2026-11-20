// Values ported unchanged from references/started-games/04-arkanoid/game.js and assets/spritesheet.js,
// except the colors (new: vector drawing replaces the third-party spritesheet).

export const GAME_KEY_CODES = ["ArrowLeft", "ArrowRight"] as const;
export const INITIAL_LIVES = 3;

export const PADDLE_WIDTH_PIXELS = 81;
export const PADDLE_HEIGHT_PIXELS = 14;
export const PADDLE_TOP_PIXELS = 560;
export const PADDLE_SPEED_PIXELS_PER_SECOND = 400;
export const PADDLE_BOUNCE_TOLERANCE_PIXELS = 8; // extra depth below the paddle that still counts as a hit

export const BALL_SIZE_PIXELS = 16;
export const BASE_BALL_HORIZONTAL_VELOCITY_PIXELS_PER_SECOND = 200;
export const BASE_BALL_VERTICAL_VELOCITY_PIXELS_PER_SECOND = -300;

export const BLOCK_COLUMNS = 10;
export const BLOCK_ROWS = 6;
export const BLOCK_WIDTH_PIXELS = 64;
export const BLOCK_HEIGHT_PIXELS = 24;
export const BLOCKS_ORIGIN_LEFT_PIXELS = 80; // (CANVAS_WIDTH − 10 × 64) / 2
export const BLOCKS_ORIGIN_TOP_PIXELS = 80;

export const POINTS_PER_BLOCK = 10;

export const EXPLOSION_DURATION_SECONDS = 0.15;
export const EXPLOSION_FRAME_ALPHAS = [1, 0.75, 0.5, 0.25] as const; // one per frame
export const EXPLOSION_FRAME_SCALES = [1, 0.8, 0.6, 0.4] as const; // size relative to the block, centered

// Drawing (flat vector, tones of the original spritesheet)
export type BlockColor = "red" | "yellow" | "cyan" | "magenta" | "hotpink" | "green" | "gray";
export const BLOCK_FILL_COLORS: Readonly<Record<BlockColor, string>> = {
  red: "#d83a4a",
  yellow: "#e8b830",
  cyan: "#3aa8e0",
  magenta: "#7a4ee0",
  hotpink: "#e05aa0",
  green: "#3cc08a",
  gray: "#6a6a7a",
};
export const BLOCK_INSET_PIXELS = 1;
export const BLOCK_HIGHLIGHT_HEIGHT_PIXELS = 3;
export const BLOCK_HIGHLIGHT_COLOR = "rgba(255,255,255,0.25)";
export const PADDLE_COLOR = "#d8d8e0";
export const PADDLE_END_COLOR = "#d83a4a";
export const PADDLE_END_WIDTH_PIXELS = 6;
export const BALL_COLOR = "#e0e0e8";
