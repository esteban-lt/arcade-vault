import { CANVAS_HEIGHT, CANVAS_WIDTH } from "../shared/canvas";
import type { Board, FallingPiece } from "./board";
import {
  BOARD_COLUMNS,
  BOARD_LEFT_PIXELS,
  BOARD_ROWS,
  BOARD_TOP_PIXELS,
  CELL_SIZE_PIXELS,
  NEXT_PREVIEW_SIZE_CELLS,
  PIECE_TYPES,
} from "./constants";
import type { BlockStackSkin, CrystalStyle } from "./skins";

export type BlockStackDrawState = {
  board: Board;
  currentPiece: FallingPiece;
  ghostRow: number;
  nextPiece: FallingPiece;
  clearedLineCount: number;
  clockSeconds: number; // animation clock (rAF time), only used by animated skins
};

const LEFT_PANEL_LEFT_PIXELS = 40;
const RIGHT_PANEL_LEFT_PIXELS = 580;
const PANEL_LABEL_TOP_PIXELS = 48;
const LINE_COUNT_TOP_PIXELS = 88;
const CONTROLS_LABEL_TOP_PIXELS = 160;
const FIRST_CONTROL_TOP_PIXELS = 192;
const CONTROL_LINE_SPACING_PIXELS = 26;
const NEXT_PREVIEW_TOP_PIXELS = 64;
const CONTROL_LINES = ["← →  mover", "↑ / X  rotar", "↓  bajar", "ESPACIO  caída", "P / ESC  pausa"];

const BOARD_WIDTH_PIXELS = BOARD_COLUMNS * CELL_SIZE_PIXELS;
const BOARD_HEIGHT_PIXELS = BOARD_ROWS * CELL_SIZE_PIXELS;
const NEXT_PREVIEW_SIZE_PIXELS = NEXT_PREVIEW_SIZE_CELLS * CELL_SIZE_PIXELS;

// A skin plus the font family resolved once per frame (the CSS variable cannot be used inside a canvas font).
type DrawStyle = { skin: BlockStackSkin; fontFamily: string; clockSeconds: number };

export function drawBlockStack(
  context: CanvasRenderingContext2D,
  state: BlockStackDrawState,
  skin: BlockStackSkin,
): void {
  const style: DrawStyle = { skin, fontFamily: resolveFontFamily(skin), clockSeconds: state.clockSeconds };
  context.imageSmoothingEnabled = !skin.isPixelated;
  context.fillStyle = skin.backgroundColor;
  context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  drawBoard(context, state.board, style);
  drawPiece(context, state.currentPiece, state.ghostRow, skin.ghostAlpha, style);
  drawPiece(context, state.currentPiece, state.currentPiece.row, 1, style);
  drawLeftPanel(context, state.clearedLineCount, style);
  drawRightPanel(context, state.nextPiece, style);
}

function resolveFontFamily(skin: BlockStackSkin): string {
  if (skin.fontCssVariable === null) return skin.fontFamily;
  const appFontFamily = getComputedStyle(document.documentElement).getPropertyValue(skin.fontCssVariable).trim();
  return appFontFamily ? `${appFontFamily}, ${skin.fontFamily}` : skin.fontFamily;
}

function drawBoard(context: CanvasRenderingContext2D, board: Board, style: DrawStyle): void {
  const { skin } = style;
  context.fillStyle = skin.boardBackgroundColor;
  context.fillRect(BOARD_LEFT_PIXELS, BOARD_TOP_PIXELS, BOARD_WIDTH_PIXELS, BOARD_HEIGHT_PIXELS);

  drawGrid(context, skin);
  drawFrame(context, BOARD_LEFT_PIXELS, BOARD_TOP_PIXELS, BOARD_WIDTH_PIXELS, BOARD_HEIGHT_PIXELS, style);

  for (let row = 0; row < BOARD_ROWS; row++) {
    for (let column = 0; column < BOARD_COLUMNS; column++) {
      drawBlock(
        context,
        BOARD_LEFT_PIXELS + column * CELL_SIZE_PIXELS,
        BOARD_TOP_PIXELS + row * CELL_SIZE_PIXELS,
        board[row][column],
        1,
        style,
      );
    }
  }
}

function drawGrid(context: CanvasRenderingContext2D, skin: BlockStackSkin): void {
  if (skin.isPixelated) {
    // Hard lines made of rectangles: strokes would blur across two pixel rows.
    context.fillStyle = skin.gridLineColor;
    for (let column = 1; column < BOARD_COLUMNS; column++) {
      context.fillRect(BOARD_LEFT_PIXELS + column * CELL_SIZE_PIXELS, BOARD_TOP_PIXELS, skin.gridLineWidthPixels, BOARD_HEIGHT_PIXELS);
    }
    for (let row = 1; row < BOARD_ROWS; row++) {
      context.fillRect(BOARD_LEFT_PIXELS, BOARD_TOP_PIXELS + row * CELL_SIZE_PIXELS, BOARD_WIDTH_PIXELS, skin.gridLineWidthPixels);
    }
    return;
  }
  context.strokeStyle = skin.gridLineColor;
  context.lineWidth = skin.gridLineWidthPixels;
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
}

// Border inside the given rectangle, with the skin's glow when it has one.
function drawFrame(
  context: CanvasRenderingContext2D,
  left: number,
  top: number,
  width: number,
  height: number,
  style: DrawStyle,
): void {
  const { skin } = style;
  const borderWidth = skin.boardBorderWidthPixels;
  if (skin.glowBlurPixels > 0) {
    context.shadowColor = skin.boardBorderColor;
    context.shadowBlur = skin.glowBlurPixels;
  }
  if (skin.isPixelated) {
    context.fillStyle = skin.boardBorderColor;
    context.fillRect(left, top, width, borderWidth);
    context.fillRect(left, top + height - borderWidth, width, borderWidth);
    context.fillRect(left, top, borderWidth, height);
    context.fillRect(left + width - borderWidth, top, borderWidth, height);
  } else {
    const halfBorder = borderWidth / 2;
    context.strokeStyle = skin.crystal
      ? createIridescentGradient(context, left, top, left + width, top + height, skin.crystal, style.clockSeconds)
      : skin.boardBorderColor;
    context.lineWidth = borderWidth;
    context.strokeRect(left + halfBorder, top + halfBorder, width - borderWidth, height - borderWidth);
  }
  context.shadowBlur = 0;
}

function drawPiece(
  context: CanvasRenderingContext2D,
  piece: FallingPiece,
  row: number,
  alpha: number,
  style: DrawStyle,
): void {
  for (let shapeRow = 0; shapeRow < piece.shape.length; shapeRow++) {
    for (let shapeColumn = 0; shapeColumn < piece.shape[shapeRow].length; shapeColumn++) {
      drawBlock(
        context,
        BOARD_LEFT_PIXELS + (piece.column + shapeColumn) * CELL_SIZE_PIXELS,
        BOARD_TOP_PIXELS + (row + shapeRow) * CELL_SIZE_PIXELS,
        piece.shape[shapeRow][shapeColumn],
        alpha,
        style,
      );
    }
  }
}

function drawLeftPanel(context: CanvasRenderingContext2D, clearedLineCount: number, style: DrawStyle): void {
  const { skin } = style;
  context.textAlign = "left";
  context.textBaseline = "alphabetic";
  drawPanelLabel(context, "LÍNEAS", LEFT_PANEL_LEFT_PIXELS, PANEL_LABEL_TOP_PIXELS, style);

  context.font = `${skin.headingFontWeight === "bold" ? "bold " : ""}${skin.valueFontSizePixels}px ${style.fontFamily}`;
  drawText(context, String(clearedLineCount), LEFT_PANEL_LEFT_PIXELS, LINE_COUNT_TOP_PIXELS, skin.panelValueColor, skin);

  drawPanelLabel(context, "CONTROLES", LEFT_PANEL_LEFT_PIXELS, CONTROLS_LABEL_TOP_PIXELS, style);
  context.font = `${skin.controlFontSizePixels}px ${style.fontFamily}`;
  CONTROL_LINES.forEach((controlLine, index) => {
    drawText(
      context,
      controlLine,
      LEFT_PANEL_LEFT_PIXELS,
      FIRST_CONTROL_TOP_PIXELS + index * CONTROL_LINE_SPACING_PIXELS,
      skin.panelTextColor,
      skin,
    );
  });
}

function drawRightPanel(context: CanvasRenderingContext2D, nextPiece: FallingPiece, style: DrawStyle): void {
  const { skin } = style;
  drawPanelLabel(context, "SIGUIENTE", RIGHT_PANEL_LEFT_PIXELS, PANEL_LABEL_TOP_PIXELS, style);

  context.fillStyle = skin.boardBackgroundColor;
  context.fillRect(RIGHT_PANEL_LEFT_PIXELS, NEXT_PREVIEW_TOP_PIXELS, NEXT_PREVIEW_SIZE_PIXELS, NEXT_PREVIEW_SIZE_PIXELS);
  drawFrame(context, RIGHT_PANEL_LEFT_PIXELS, NEXT_PREVIEW_TOP_PIXELS, NEXT_PREVIEW_SIZE_PIXELS, NEXT_PREVIEW_SIZE_PIXELS, style);

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
        style,
      );
    }
  }
}

function drawPanelLabel(
  context: CanvasRenderingContext2D,
  text: string,
  left: number,
  top: number,
  style: DrawStyle,
): void {
  const { skin } = style;
  context.font = `${skin.headingFontWeight === "bold" ? "bold " : ""}${skin.labelFontSizePixels}px ${style.fontFamily}`;
  drawText(context, text, left, top, skin.panelLabelColor, skin);
}

// Draws text with the font already set on the context, adding the skin's text glow.
function drawText(
  context: CanvasRenderingContext2D,
  text: string,
  left: number,
  top: number,
  color: string,
  skin: BlockStackSkin,
): void {
  context.fillStyle = color;
  if (skin.textGlowBlurPixels > 0) {
    context.shadowColor = color;
    context.shadowBlur = skin.textGlowBlurPixels;
  }
  context.fillText(text, left, top);
  context.shadowBlur = 0;
}

// One cell. 0 draws nothing. The look depends on the skin's block style.
function drawBlock(
  context: CanvasRenderingContext2D,
  left: number,
  top: number,
  value: number,
  alpha: number,
  style: DrawStyle,
): void {
  const { skin } = style;
  const pieceType = PIECE_TYPES.find((type) => type === value);
  if (pieceType === undefined) return;
  const pieceColor = skin.pieceColors[pieceType];
  const inset = skin.blockInsetPixels;
  const blockSize = CELL_SIZE_PIXELS - 2 * inset;
  const bandSize = skin.blockHighlightSizePixels;
  context.globalAlpha = alpha;
  if (skin.glowBlurPixels > 0) {
    context.shadowColor = pieceColor;
    context.shadowBlur = skin.glowBlurPixels * alpha;
  }

  if (skin.blockStyle === "crystal" && skin.crystal) {
    drawCrystalBlock(context, left + inset, top + inset, blockSize, pieceColor, skin.crystal, style.clockSeconds, alpha);
  } else if (skin.blockStyle === "outline") {
    // Translucent fill plus a bright contour that carries the glow.
    context.globalAlpha = alpha * 0.35;
    context.fillStyle = pieceColor;
    context.fillRect(left + inset, top + inset, blockSize, blockSize);
    context.globalAlpha = alpha;
    context.strokeStyle = pieceColor;
    context.lineWidth = 2;
    context.strokeRect(left + inset + 1, top + inset + 1, blockSize - 2, blockSize - 2);
  } else {
    context.fillStyle = pieceColor;
    context.fillRect(left + inset, top + inset, blockSize, blockSize);
    context.shadowBlur = 0;
    if (skin.blockStyle === "pixel" && skin.blockShadeColor !== null) {
      context.fillStyle = skin.blockShadeColor;
      context.fillRect(left + inset, top + inset + blockSize - bandSize, blockSize, bandSize);
      context.fillRect(left + inset + blockSize - bandSize, top + inset, bandSize, blockSize);
      context.fillStyle = skin.blockHighlightColor;
      context.fillRect(left + inset, top + inset, blockSize, bandSize);
      context.fillRect(left + inset, top + inset, bandSize, blockSize);
    } else {
      context.fillStyle = skin.blockHighlightColor;
      context.fillRect(left + inset, top + inset, blockSize, bandSize);
    }
  }
  context.shadowBlur = 0;
  context.globalAlpha = 1;
}

// Linear gradient whose hue drifts with the clock: the iridescent edge of crystal pieces and frames.
function createIridescentGradient(
  context: CanvasRenderingContext2D,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  crystal: CrystalStyle,
  clockSeconds: number,
): CanvasGradient {
  const gradient = context.createLinearGradient(fromX, fromY, toX, toY);
  const hue = crystal.edgeBaseHueDegrees + clockSeconds * crystal.hueSpeedDegreesPerSecond + (fromX + fromY) * 0.3;
  const colorStops = [0, 0.5, 1];
  for (const stop of colorStops) {
    const stopHue = (hue + stop * crystal.hueSpreadDegrees) % 360;
    gradient.addColorStop(stop, `hsl(${stopHue} ${crystal.edgeSaturationPercent}% ${crystal.edgeLightnessPercent}%)`);
  }
  return gradient;
}

// Translucent faceted glass: tinted body, light and shade triangles, iridescent edge and a moving refraction band.
function drawCrystalBlock(
  context: CanvasRenderingContext2D,
  left: number,
  top: number,
  size: number,
  pieceColor: string,
  crystal: CrystalStyle,
  clockSeconds: number,
  alpha: number,
): void {
  context.globalAlpha = alpha * crystal.fillAlpha;
  context.fillStyle = pieceColor;
  context.fillRect(left, top, size, size);
  context.globalAlpha = alpha;

  context.fillStyle = crystal.facetLightColor;
  context.beginPath();
  context.moveTo(left, top);
  context.lineTo(left + size, top);
  context.lineTo(left, top + size);
  context.closePath();
  context.fill();

  context.fillStyle = crystal.facetShadeColor;
  context.beginPath();
  context.moveTo(left + size, top);
  context.lineTo(left + size, top + size);
  context.lineTo(left, top + size);
  context.closePath();
  context.fill();

  // Refraction band: a diagonal stripe sweeping across the block, offset per cell so the glass shimmers in waves.
  const phase = (clockSeconds / crystal.shimmerPeriodSeconds + (left + top) / 600) % 1;
  const bandCenter = phase * size * 2;
  context.save();
  context.beginPath();
  context.rect(left, top, size, size);
  context.clip();
  context.fillStyle = crystal.shimmerColor;
  context.beginPath();
  context.moveTo(left + bandCenter, top);
  context.lineTo(left + bandCenter + crystal.shimmerWidthPixels, top);
  context.lineTo(left + bandCenter - size + crystal.shimmerWidthPixels, top + size);
  context.lineTo(left + bandCenter - size, top + size);
  context.closePath();
  context.fill();
  context.restore();

  context.strokeStyle = createIridescentGradient(context, left, top, left + size, top + size, crystal, clockSeconds);
  context.lineWidth = 1.5;
  context.strokeRect(left + 0.75, top + 0.75, size - 1.5, size - 1.5);
}
