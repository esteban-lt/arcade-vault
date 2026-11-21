import {
  BOARD_COLUMNS,
  BOARD_ROWS,
  CELL_SIZE_PIXELS,
  INITIAL_DIRECTION,
  INITIAL_SNAKE_HEAD_COLUMN,
  INITIAL_SNAKE_HEAD_ROW,
  INITIAL_SNAKE_LENGTH,
  MAXIMUM_QUEUED_TURNS,
  SNAKE_BODY_COLOR,
  SNAKE_CRASHED_HEAD_COLOR,
  SNAKE_EYE_COLOR,
  SNAKE_EYE_SIZE_PIXELS,
  SNAKE_HEAD_COLOR,
  SNAKE_SEGMENT_INSET_PIXELS,
  type Cell,
  type Direction,
} from "./constants";

const DIRECTION_OFFSETS: Readonly<Record<Direction, Cell>> = {
  up: { column: 0, row: -1 },
  down: { column: 0, row: 1 },
  left: { column: -1, row: 0 },
  right: { column: 1, row: 0 },
};

const OPPOSITE_DIRECTIONS: Readonly<Record<Direction, Direction>> = {
  up: "down",
  down: "up",
  left: "right",
  right: "left",
};

const EYE_DISTANCE_FROM_FACING_EDGE_PIXELS = 4;
const EYE_SEPARATION_PIXELS = 8; // between the centers of both eyes

function isSameCell(first: Cell, second: Cell): boolean {
  return first.column === second.column && first.row === second.row;
}

function isInsideBoard(cell: Cell): boolean {
  return cell.column >= 0 && cell.column < BOARD_COLUMNS && cell.row >= 0 && cell.row < BOARD_ROWS;
}

export class Snake {
  // Index 0 is the head.
  readonly segments: Cell[] = [];
  direction: Direction = INITIAL_DIRECTION;
  private readonly queuedTurns: Direction[] = [];
  isCrashed = false;

  constructor() {
    for (let index = 0; index < INITIAL_SNAKE_LENGTH; index++) {
      this.segments.push({ column: INITIAL_SNAKE_HEAD_COLUMN - index, row: INITIAL_SNAKE_HEAD_ROW });
    }
  }

  // Queues a turn unless the queue is full, or the turn repeats or reverses the last requested direction.
  requestTurn(direction: Direction): void {
    if (this.queuedTurns.length >= MAXIMUM_QUEUED_TURNS) return;
    const lastRequestedDirection = this.queuedTurns.at(-1) ?? this.direction;
    if (direction === lastRequestedDirection || direction === OPPOSITE_DIRECTIONS[lastRequestedDirection]) return;
    this.queuedTurns.push(direction);
  }

  // Applies at most one queued turn and returns the cell in front of the head.
  nextHeadCell(): Cell {
    const turn = this.queuedTurns.shift();
    if (turn) this.direction = turn;
    const head = this.segments[0];
    const offset = DIRECTION_OFFSETS[this.direction];
    return { column: head.column + offset.column, row: head.row + offset.row };
  }

  advanceTo(cell: Cell, isGrowing: boolean): void {
    this.segments.unshift(cell);
    if (!isGrowing) this.segments.pop();
  }

  // The tail cell is vacated in the same step when the snake is not growing, so it does not count.
  collidesWith(cell: Cell, isGrowing: boolean): boolean {
    if (!isInsideBoard(cell)) return true;
    const checkedLength = isGrowing ? this.segments.length : this.segments.length - 1;
    for (let index = 0; index < checkedLength; index++) {
      if (isSameCell(this.segments[index], cell)) return true;
    }
    return false;
  }

  occupies(cell: Cell): boolean {
    return this.segments.some((segment) => isSameCell(segment, cell));
  }

  draw(context: CanvasRenderingContext2D): void {
    const segmentSize = CELL_SIZE_PIXELS - SNAKE_SEGMENT_INSET_PIXELS * 2;
    // Tail first, so the head is drawn on top.
    for (let index = this.segments.length - 1; index >= 0; index--) {
      const segment = this.segments[index];
      if (index === 0) {
        context.fillStyle = this.isCrashed ? SNAKE_CRASHED_HEAD_COLOR : SNAKE_HEAD_COLOR;
      } else {
        context.fillStyle = SNAKE_BODY_COLOR;
      }
      context.fillRect(
        segment.column * CELL_SIZE_PIXELS + SNAKE_SEGMENT_INSET_PIXELS,
        segment.row * CELL_SIZE_PIXELS + SNAKE_SEGMENT_INSET_PIXELS,
        segmentSize,
        segmentSize,
      );
    }
    this.drawEyes(context);
  }

  private drawEyes(context: CanvasRenderingContext2D): void {
    const head = this.segments[0];
    const centerX = head.column * CELL_SIZE_PIXELS + CELL_SIZE_PIXELS / 2;
    const centerY = head.row * CELL_SIZE_PIXELS + CELL_SIZE_PIXELS / 2;
    const forward = DIRECTION_OFFSETS[this.direction];
    // Eye centers: pushed toward the facing edge, spread across the perpendicular axis.
    const forwardDistance = CELL_SIZE_PIXELS / 2 - EYE_DISTANCE_FROM_FACING_EDGE_PIXELS - SNAKE_EYE_SIZE_PIXELS / 2;
    const sideDistance = EYE_SEPARATION_PIXELS / 2;
    context.fillStyle = SNAKE_EYE_COLOR;
    for (const side of [-1, 1]) {
      const eyeCenterX = centerX + forward.column * forwardDistance + forward.row * side * sideDistance;
      const eyeCenterY = centerY + forward.row * forwardDistance + forward.column * side * sideDistance;
      context.fillRect(
        eyeCenterX - SNAKE_EYE_SIZE_PIXELS / 2,
        eyeCenterY - SNAKE_EYE_SIZE_PIXELS / 2,
        SNAKE_EYE_SIZE_PIXELS,
        SNAKE_EYE_SIZE_PIXELS,
      );
    }
  }
}
