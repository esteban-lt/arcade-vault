import { BOARD_COLUMNS, BOARD_ROWS, type PieceType } from "./constants";

// BOARD_ROWS × BOARD_COLUMNS, indexed board[row][column]; 0 = empty, 1–7 = PieceType of the locked block.
export type Board = number[][];

// A piece shape: square matrix where 0 = empty and any other value = the PieceType of that block.
export type PieceShape = readonly (readonly number[])[];

export type FallingPiece = {
  type: PieceType;
  shape: PieceShape;
  column: number;
  row: number;
};

export function createEmptyBoard(): Board {
  return Array.from({ length: BOARD_ROWS }, () => new Array<number>(BOARD_COLUMNS).fill(0));
}

// True when a block of the shape leaves the sides or the bottom, or overlaps a locked block.
// Rows above the board (negative) never collide with blocks.
export function collidesWithBoard(board: Board, shape: PieceShape, column: number, row: number): boolean {
  for (let shapeRow = 0; shapeRow < shape.length; shapeRow++) {
    for (let shapeColumn = 0; shapeColumn < shape[shapeRow].length; shapeColumn++) {
      if (!shape[shapeRow][shapeColumn]) continue;
      const boardColumn = column + shapeColumn;
      const boardRow = row + shapeRow;
      if (boardColumn < 0 || boardColumn >= BOARD_COLUMNS || boardRow >= BOARD_ROWS) return true;
      if (boardRow >= 0 && board[boardRow][boardColumn]) return true;
    }
  }
  return false;
}

export function mergePieceIntoBoard(board: Board, piece: FallingPiece): void {
  for (let shapeRow = 0; shapeRow < piece.shape.length; shapeRow++) {
    for (let shapeColumn = 0; shapeColumn < piece.shape[shapeRow].length; shapeColumn++) {
      const value = piece.shape[shapeRow][shapeColumn];
      if (value) board[piece.row + shapeRow][piece.column + shapeColumn] = value;
    }
  }
}

// Removes complete rows bottom-up, inserts empty rows on top and returns how many were removed.
export function clearCompleteRows(board: Board): number {
  let clearedRowCount = 0;
  for (let row = BOARD_ROWS - 1; row >= 0; row--) {
    if (board[row].every((value) => value !== 0)) {
      board.splice(row, 1);
      board.unshift(new Array<number>(BOARD_COLUMNS).fill(0));
      clearedRowCount++;
      row++; // the rows above moved down: check this index again
    }
  }
  return clearedRowCount;
}
