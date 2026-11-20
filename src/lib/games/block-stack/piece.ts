import { collidesWithBoard, type Board, type FallingPiece, type PieceShape } from "./board";
import { BOARD_COLUMNS, PIECE_SHAPES, PIECE_TYPES, ROTATION_KICK_OFFSETS } from "./constants";

// Uniform pick among the 7 types, spawned on row 0 and horizontally centered like the original.
export function createRandomPiece(): FallingPiece {
  const type = PIECE_TYPES[Math.floor(Math.random() * PIECE_TYPES.length)];
  const shape = PIECE_SHAPES[type].map((row) => [...row]);
  const column = Math.floor(BOARD_COLUMNS / 2) - Math.floor(shape[0].length / 2);
  return { type, shape, column, row: 0 };
}

// Clockwise rotation: transpose, then reverse each row. Returns a new matrix.
export function rotateShapeClockwise(shape: PieceShape): PieceShape {
  const rowCount = shape.length;
  const columnCount = shape[0].length;
  const rotated = Array.from({ length: columnCount }, () => new Array<number>(rowCount).fill(0));
  for (let row = 0; row < rowCount; row++) {
    for (let column = 0; column < columnCount; column++) {
      rotated[column][rowCount - 1 - row] = shape[row][column];
    }
  }
  return rotated;
}

// Rotates the piece in place, trying the horizontal kicks in order. Returns false when none fits.
export function tryRotatePiece(board: Board, piece: FallingPiece): boolean {
  const rotatedShape = rotateShapeClockwise(piece.shape);
  for (const kickOffset of ROTATION_KICK_OFFSETS) {
    if (!collidesWithBoard(board, rotatedShape, piece.column + kickOffset, piece.row)) {
      piece.shape = rotatedShape;
      piece.column += kickOffset;
      return true;
    }
  }
  return false;
}

// Lowest row the piece can reach by falling straight down (used by the ghost and the hard drop).
export function findLandingRow(board: Board, piece: FallingPiece): number {
  let landingRow = piece.row;
  while (!collidesWithBoard(board, piece.shape, piece.column, landingRow + 1)) landingRow++;
  return landingRow;
}
