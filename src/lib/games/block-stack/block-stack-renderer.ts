import { CANVAS_HEIGHT, CANVAS_WIDTH } from "../shared/canvas";
import type { Board, FallingPiece } from "./board";
import {
  BLOCK_HIGHLIGHT_COLOR,
  BLOCK_HIGHLIGHT_HEIGHT_PIXELS,
  BLOCK_INSET_PIXELS,
  BOARD_BACKGROUND_COLOR,
  BOARD_BORDER_COLOR,
  BOARD_COLUMNS,
  BOARD_LEFT_PIXELS,
  BOARD_ROWS,
  BOARD_TOP_PIXELS,
  CELL_SIZE_PIXELS,
  GHOST_PIECE_ALPHA,
  GRID_LINE_COLOR,
  GRID_LINE_WIDTH_PIXELS,
  NEXT_PREVIEW_SIZE_CELLS,
  PANEL_LABEL_COLOR,
  PANEL_TEXT_COLOR,
  PANEL_VALUE_COLOR,
  PIECE_COLORS,
  PIECE_TYPES,
} from "./constants";

export type BlockStackDrawState = {
  board: Board;
  currentPiece: FallingPiece;
  ghostRow: number;
  nextPiece: FallingPiece;
  clearedLineCount: number;
};

const LEFT_PANEL_LEFT_PIXELS = 40;
const RIGHT_PANEL_LEFT_PIXELS = 580;
const PANEL_LABEL_TOP_PIXELS = 48;
const LINE_COUNT_TOP_PIXELS = 88;
const CONTROLS_LABEL_TOP_PIXELS = 160;
const FIRST_CONTROL_TOP_PIXELS = 192;
const CONTROL_LINE_SPACING_PIXELS = 26;
const NEXT_PREVIEW_TOP_PIXELS = 64;
const PANEL_FONT_FAMILY = '"Courier New", monospace';
const CONTROL_LINES = ["← →  mover", "↑ / X  rotar", "↓  bajar", "ESPACIO  caída", "P / ESC  pausa"];

const BOARD_WIDTH_PIXELS = BOARD_COLUMNS * CELL_SIZE_PIXELS;
const BOARD_HEIGHT_PIXELS = BOARD_ROWS * CELL_SIZE_PIXELS;
const NEXT_PREVIEW_SIZE_PIXELS = NEXT_PREVIEW_SIZE_CELLS * CELL_SIZE_PIXELS;

export function drawBlockStack(context: CanvasRenderingContext2D, state: BlockStackDrawState): void {
  context.fillStyle = "#000";
  context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  drawBoard(context, state.board);
  drawPiece(context, state.currentPiece, state.ghostRow, GHOST_PIECE_ALPHA);
  drawPiece(context, state.currentPiece, state.currentPiece.row, 1);
  drawLeftPanel(context, state.clearedLineCount);
  drawRightPanel(context, state.nextPiece);
}

function drawBoard(context: CanvasRenderingContext2D, board: Board): void {
  context.fillStyle = BOARD_BACKGROUND_COLOR;
  context.fillRect(BOARD_LEFT_PIXELS, BOARD_TOP_PIXELS, BOARD_WIDTH_PIXELS, BOARD_HEIGHT_PIXELS);

  context.strokeStyle = GRID_LINE_COLOR;
  context.lineWidth = GRID_LINE_WIDTH_PIXELS;
  context.beginPath();
  for (let column = 1; column < BOARD_COLUMNS; column++) {
    const x = BOARD_LEFT_PIXELS + column * CELL_SIZE_PIXELS;
    context.moveTo(x, BOARD_TOP_PIXELS);
    context.lineTo(x, BOARD_TOP_PIXELS + BOARD_HEIGHT_PIXELS);
  }
  for (let row = 1; row < BOARD_ROWS; row++) {
    const y = BOARD_TOP_PIXELS + row * CELL_SIZE_PIXELS;
    context.moveTo(BOARD_LEFT_PIXELS, y);
    context.lineTo(BOARD_LEFT_PIXELS + BOARD_WIDTH_PIXELS, y);
  }
  context.stroke();

  context.strokeStyle = BOARD_BORDER_COLOR;
  context.lineWidth = 1;
  context.strokeRect(BOARD_LEFT_PIXELS + 0.5, BOARD_TOP_PIXELS + 0.5, BOARD_WIDTH_PIXELS - 1, BOARD_HEIGHT_PIXELS - 1);

  for (let row = 0; row < BOARD_ROWS; row++) {
    for (let column = 0; column < BOARD_COLUMNS; column++) {
      drawBlock(
        context,
        BOARD_LEFT_PIXELS + column * CELL_SIZE_PIXELS,
        BOARD_TOP_PIXELS + row * CELL_SIZE_PIXELS,
        board[row][column],
        1,
      );
    }
  }
}

function drawPiece(context: CanvasRenderingContext2D, piece: FallingPiece, row: number, alpha: number): void {
  for (let shapeRow = 0; shapeRow < piece.shape.length; shapeRow++) {
    for (let shapeColumn = 0; shapeColumn < piece.shape[shapeRow].length; shapeColumn++) {
      drawBlock(
        context,
        BOARD_LEFT_PIXELS + (piece.column + shapeColumn) * CELL_SIZE_PIXELS,
        BOARD_TOP_PIXELS + (row + shapeRow) * CELL_SIZE_PIXELS,
        piece.shape[shapeRow][shapeColumn],
        alpha,
      );
    }
  }
}

function drawLeftPanel(context: CanvasRenderingContext2D, clearedLineCount: number): void {
  context.textAlign = "left";
  context.textBaseline = "alphabetic";
  drawPanelLabel(context, "LÍNEAS", LEFT_PANEL_LEFT_PIXELS, PANEL_LABEL_TOP_PIXELS);

  context.fillStyle = PANEL_VALUE_COLOR;
  context.font = `bold 32px ${PANEL_FONT_FAMILY}`;
  context.fillText(String(clearedLineCount), LEFT_PANEL_LEFT_PIXELS, LINE_COUNT_TOP_PIXELS);

  drawPanelLabel(context, "CONTROLES", LEFT_PANEL_LEFT_PIXELS, CONTROLS_LABEL_TOP_PIXELS);
  context.fillStyle = PANEL_TEXT_COLOR;
  context.font = `14px ${PANEL_FONT_FAMILY}`;
  CONTROL_LINES.forEach((controlLine, index) => {
    context.fillText(
      controlLine,
      LEFT_PANEL_LEFT_PIXELS,
      FIRST_CONTROL_TOP_PIXELS + index * CONTROL_LINE_SPACING_PIXELS,
    );
  });
}

function drawRightPanel(context: CanvasRenderingContext2D, nextPiece: FallingPiece): void {
  drawPanelLabel(context, "SIGUIENTE", RIGHT_PANEL_LEFT_PIXELS, PANEL_LABEL_TOP_PIXELS);

  context.fillStyle = BOARD_BACKGROUND_COLOR;
  context.fillRect(RIGHT_PANEL_LEFT_PIXELS, NEXT_PREVIEW_TOP_PIXELS, NEXT_PREVIEW_SIZE_PIXELS, NEXT_PREVIEW_SIZE_PIXELS);
  context.strokeStyle = BOARD_BORDER_COLOR;
  context.lineWidth = 1;
  context.strokeRect(
    RIGHT_PANEL_LEFT_PIXELS + 0.5,
    NEXT_PREVIEW_TOP_PIXELS + 0.5,
    NEXT_PREVIEW_SIZE_PIXELS - 1,
    NEXT_PREVIEW_SIZE_PIXELS - 1,
  );

  const shape = nextPiece.shape;
  const columnOffset = Math.floor((NEXT_PREVIEW_SIZE_CELLS - shape[0].length) / 2);
  const rowOffset = Math.floor((NEXT_PREVIEW_SIZE_CELLS - shape.length) / 2);
  for (let shapeRow = 0; shapeRow < shape.length; shapeRow++) {
    for (let shapeColumn = 0; shapeColumn < shape[shapeRow].length; shapeColumn++) {
      drawBlock(
        context,
        RIGHT_PANEL_LEFT_PIXELS + (columnOffset + shapeColumn) * CELL_SIZE_PIXELS,
        NEXT_PREVIEW_TOP_PIXELS + (rowOffset + shapeRow) * CELL_SIZE_PIXELS,
        shape[shapeRow][shapeColumn],
        1,
      );
    }
  }
}

function drawPanelLabel(context: CanvasRenderingContext2D, text: string, left: number, top: number): void {
  context.fillStyle = PANEL_LABEL_COLOR;
  context.font = `bold 12px ${PANEL_FONT_FAMILY}`;
  context.fillText(text, left, top);
}

// One cell: a 28 px square (1 px inset per side) with a 4 px highlight band on top. 0 draws nothing.
function drawBlock(context: CanvasRenderingContext2D, left: number, top: number, value: number, alpha: number): void {
  const pieceType = PIECE_TYPES.find((type) => type === value);
  if (pieceType === undefined) return;
  const blockSize = CELL_SIZE_PIXELS - 2 * BLOCK_INSET_PIXELS;
  context.globalAlpha = alpha;
  context.fillStyle = PIECE_COLORS[pieceType];
  context.fillRect(left + BLOCK_INSET_PIXELS, top + BLOCK_INSET_PIXELS, blockSize, blockSize);
  context.fillStyle = BLOCK_HIGHLIGHT_COLOR;
  context.fillRect(left + BLOCK_INSET_PIXELS, top + BLOCK_INSET_PIXELS, blockSize, BLOCK_HIGHLIGHT_HEIGHT_PIXELS);
  context.globalAlpha = 1;
}
