// Ported unchanged from references/started-games/04-arkanoid/levels.js.
// Blocks are listed row by row (top to bottom) and left to right inside each row, as in the original:
// that order decides which block breaks when the ball overlaps two at once.

import { BLOCK_COLUMNS, BLOCK_ROWS, type BlockColor } from "./constants";

export type LevelBlock = { column: number; row: number; color: BlockColor };
export type LevelDefinition = { ballSpeedMultiplier: number; blocks: readonly LevelBlock[] };

function buildBlocks(colorAt: (column: number, row: number) => BlockColor | null): LevelBlock[] {
  const blocks: LevelBlock[] = [];
  for (let row = 0; row < BLOCK_ROWS; row++) {
    for (let column = 0; column < BLOCK_COLUMNS; column++) {
      const color = colorAt(column, row);
      if (color !== null) blocks.push({ column, row, color });
    }
  }
  return blocks;
}

// Level 1: full grid (60 blocks).
const FULL_GRID_ROW_COLORS: readonly BlockColor[] = ["red", "yellow", "cyan", "magenta", "hotpink", "green"];

// Level 2: pyramid (40 blocks).
const PYRAMID_ROW_COLORS: readonly BlockColor[] = ["gray", "cyan", "hotpink", "yellow", "magenta", "green"];
const PYRAMID_FIRST_COLUMNS = [4, 3, 2, 1, 0, 0] as const;
const PYRAMID_LAST_COLUMNS = [5, 6, 7, 8, 9, 9] as const;

// Level 4: rows with gaps (39 blocks).
const GAPPED_ROW_COLORS: readonly BlockColor[] = ["cyan", "magenta", "green", "yellow", "hotpink", "red"];
const GAP_COLUMNS_BY_ROW: readonly (readonly number[])[] = [
  [2, 5, 8],
  [0, 4, 7, 9],
  [1, 3, 6],
  [2, 5, 8, 9],
  [0, 4, 7],
  [1, 3, 6, 9],
];

// Level 5: frame and central cross (39 blocks).
const CROSS_COLUMN = 4;
const CROSS_ROW = 2;

export const LEVEL_DEFINITIONS: readonly LevelDefinition[] = [
  {
    ballSpeedMultiplier: 1.0,
    blocks: buildBlocks((_column, row) => FULL_GRID_ROW_COLORS[row]),
  },
  {
    ballSpeedMultiplier: 1.1,
    blocks: buildBlocks((column, row) =>
      column >= PYRAMID_FIRST_COLUMNS[row] && column <= PYRAMID_LAST_COLUMNS[row] ? PYRAMID_ROW_COLORS[row] : null,
    ),
  },
  {
    ballSpeedMultiplier: 1.21,
    blocks: buildBlocks((column, row) => ((column + row) % 2 === 0 ? (row < 3 ? "yellow" : "magenta") : null)),
  },
  {
    ballSpeedMultiplier: 1.33,
    blocks: buildBlocks((column, row) => (GAP_COLUMNS_BY_ROW[row].includes(column) ? null : GAPPED_ROW_COLORS[row])),
  },
  {
    ballSpeedMultiplier: 1.46,
    blocks: buildBlocks((column, row) => {
      const isFrame = column === 0 || column === BLOCK_COLUMNS - 1 || row === 0 || row === BLOCK_ROWS - 1;
      const isCross = column === CROSS_COLUMN || row === CROSS_ROW;
      if (!isFrame && !isCross) return null;
      return isCross && !isFrame ? "hotpink" : "cyan";
    }),
  },
];
