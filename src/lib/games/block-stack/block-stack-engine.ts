import type { GameEngine, GameEngineCallbacks, GameEngineFactory, GameSnapshot } from "../game-engine";
import { MAXIMUM_FRAME_SECONDS } from "../shared/canvas";
import { KeyboardInput } from "../shared/keyboard-input";
import { drawBlockStack } from "./block-stack-renderer";
import { clearCompleteRows, collidesWithBoard, createEmptyBoard, mergePieceIntoBoard, type Board } from "./board";
import {
  DROP_INTERVAL_DECREASE_PER_LEVEL_SECONDS,
  GAME_KEY_CODES,
  HARD_DROP_POINTS_PER_ROW,
  INITIAL_DROP_INTERVAL_SECONDS,
  INITIAL_LIVES,
  LINE_CLEAR_POINTS,
  LINES_PER_LEVEL,
  MINIMUM_DROP_INTERVAL_SECONDS,
  REPEATING_KEY_CODES,
  SOFT_DROP_POINTS_PER_ROW,
} from "./constants";
import { HeldKeyRepeater } from "./held-key-repeater";
import { createRandomPiece, findLandingRow, tryRotatePiece } from "./piece";
import { DEFAULT_SKIN_ID, SKINS, type SkinId } from "./skins";

type BlockStackPhase = "playing" | "game-over";

class BlockStackEngine implements GameEngine {
  private readonly context: CanvasRenderingContext2D;
  private readonly callbacks: GameEngineCallbacks;
  private readonly input = new KeyboardInput(GAME_KEY_CODES);
  private readonly keyRepeater = new HeldKeyRepeater(this.input, REPEATING_KEY_CODES);

  private board: Board = createEmptyBoard();
  private currentPiece = createRandomPiece();
  private nextPiece = createRandomPiece();
  private score = 0;
  private clearedLineCount = 0;
  private level = 1;
  private lives = INITIAL_LIVES;
  private phase: BlockStackPhase = "playing";
  private dropAccumulatedSeconds = 0;

  private isPaused = false;
  private animationFrameId: number | null = null;
  private lastTimestamp: number | null = null;
  private clockSeconds = 0; // rAF time, drives skin animations only
  private lastEmittedSnapshot: GameSnapshot | null = null;
  private skinId: SkinId = DEFAULT_SKIN_ID;

  constructor(canvas: HTMLCanvasElement, callbacks: GameEngineCallbacks) {
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Block Stack: the 2D canvas context is not available.");
    this.context = context;
    this.callbacks = callbacks;
  }

  start(): void {
    if (this.animationFrameId !== null) return;
    this.startNewGame();
    this.animationFrameId = requestAnimationFrame(this.loop);
  }

  setPaused(isPaused: boolean): void {
    this.isPaused = isPaused;
  }

  restart(): void {
    this.startNewGame();
  }

  endGame(): void {
    if (this.phase === "game-over") return;
    this.finishGame();
  }

  destroy(): void {
    if (this.animationFrameId !== null) cancelAnimationFrame(this.animationFrameId);
    this.animationFrameId = null;
    this.input.detach();
  }

  // ── Skin ──────────────────────────────────────────────────────────────────────

  // Called by the player (selector and saved skin). The loop redraws every frame, also while
  // paused and after game over, so the new skin shows on the next frame.
  setSkin(skinId: SkinId): void {
    this.skinId = skinId;
  }

  // ── Game state ────────────────────────────────────────────────────────────────

  private startNewGame(): void {
    this.board = createEmptyBoard();
    this.currentPiece = createRandomPiece();
    this.nextPiece = createRandomPiece();
    this.score = 0;
    this.clearedLineCount = 0;
    this.level = 1;
    this.lives = INITIAL_LIVES;
    this.phase = "playing";
    this.dropAccumulatedSeconds = 0;
    this.keyRepeater.reset();
    this.lastTimestamp = null;
    // Always emit: the player has just reset its HUD to its own defaults.
    this.lastEmittedSnapshot = null;
    this.input.attach();
    this.emitSnapshotIfChanged();
  }

  private finishGame(): void {
    this.phase = "game-over";
    this.input.detach();
    this.emitSnapshotIfChanged();
    this.callbacks.onGameOver(this.score);
  }

  private emitSnapshotIfChanged(): void {
    const previous = this.lastEmittedSnapshot;
    if (
      previous &&
      previous.score === this.score &&
      previous.lives === this.lives &&
      previous.level === this.level
    ) {
      return;
    }
    this.lastEmittedSnapshot = { score: this.score, lives: this.lives, level: this.level };
    this.callbacks.onSnapshotChange(this.lastEmittedSnapshot);
  }

  // ── Update ────────────────────────────────────────────────────────────────────

  private readonly loop = (timestamp: number): void => {
    this.clockSeconds = timestamp / 1000;
    if (this.isPaused) {
      // Forget the timestamp so resuming does not count the paused time, and discard
      // key presses made while paused so they do not fire when the game resumes.
      this.lastTimestamp = null;
      GAME_KEY_CODES.forEach((keyCode) => this.input.consumePress(keyCode));
    } else {
      const deltaSeconds =
        this.lastTimestamp === null
          ? 0
          : Math.min((timestamp - this.lastTimestamp) / 1000, MAXIMUM_FRAME_SECONDS);
      this.lastTimestamp = timestamp;
      this.update(deltaSeconds);
      this.emitSnapshotIfChanged();
    }
    this.draw();
    this.animationFrameId = requestAnimationFrame(this.loop);
  };

  private update(deltaSeconds: number): void {
    if (this.isGameOver()) return;
    this.handleInput(deltaSeconds);
    if (this.isGameOver()) return;
    this.applyGravity(deltaSeconds);
  }

  // A method instead of an inline comparison: actions can end the game mid-update,
  // and TypeScript would keep this.phase narrowed to "playing".
  private isGameOver(): boolean {
    return this.phase === "game-over";
  }

  // Order: move, rotate, soft drop, hard drop. Stops as soon as a lock ends the game.
  private handleInput(deltaSeconds: number): void {
    const firedKeyCodes = this.keyRepeater.update(deltaSeconds);

    for (const keyCode of firedKeyCodes) {
      if (keyCode === "ArrowLeft") this.movePiece(-1);
      if (keyCode === "ArrowRight") this.movePiece(1);
    }

    const rotationCount =
      Number(this.input.consumePress("ArrowUp")) + Number(this.input.consumePress("KeyX"));
    for (let rotation = 0; rotation < rotationCount; rotation++) {
      tryRotatePiece(this.board, this.currentPiece);
    }

    for (const keyCode of firedKeyCodes) {
      if (keyCode !== "ArrowDown") continue;
      this.softDrop();
      if (this.isGameOver()) return;
    }

    if (this.input.consumePress("Space")) this.hardDrop();
  }

  private applyGravity(deltaSeconds: number): void {
    this.dropAccumulatedSeconds += deltaSeconds;
    if (this.dropAccumulatedSeconds < this.dropIntervalSeconds()) return;
    this.dropAccumulatedSeconds = 0;
    const piece = this.currentPiece;
    if (collidesWithBoard(this.board, piece.shape, piece.column, piece.row + 1)) {
      this.lockPiece();
    } else {
      piece.row++;
    }
  }

  private dropIntervalSeconds(): number {
    return Math.max(
      MINIMUM_DROP_INTERVAL_SECONDS,
      INITIAL_DROP_INTERVAL_SECONDS - (this.level - 1) * DROP_INTERVAL_DECREASE_PER_LEVEL_SECONDS,
    );
  }

  private movePiece(columnDirection: number): void {
    const piece = this.currentPiece;
    if (!collidesWithBoard(this.board, piece.shape, piece.column + columnDirection, piece.row)) {
      piece.column += columnDirection;
    }
  }

  // One row down (+1 point); with no room below the piece locks at once (no lock delay).
  private softDrop(): void {
    const piece = this.currentPiece;
    if (collidesWithBoard(this.board, piece.shape, piece.column, piece.row + 1)) {
      this.lockPiece();
      return;
    }
    piece.row++;
    this.score += SOFT_DROP_POINTS_PER_ROW;
  }

  private hardDrop(): void {
    const landingRow = findLandingRow(this.board, this.currentPiece);
    this.score += (landingRow - this.currentPiece.row) * HARD_DROP_POINTS_PER_ROW;
    this.currentPiece.row = landingRow;
    this.lockPiece();
  }

  private lockPiece(): void {
    mergePieceIntoBoard(this.board, this.currentPiece);
    const clearedRowCount = clearCompleteRows(this.board);
    if (clearedRowCount > 0) {
      // Points use the level before the line clear raises it.
      this.score += (LINE_CLEAR_POINTS[clearedRowCount] ?? 0) * this.level;
      this.clearedLineCount += clearedRowCount;
      this.level = Math.floor(this.clearedLineCount / LINES_PER_LEVEL) + 1;
    }
    this.spawnNextPiece();
  }

  private spawnNextPiece(): void {
    this.currentPiece = this.nextPiece;
    this.nextPiece = createRandomPiece();
    const piece = this.currentPiece;
    if (collidesWithBoard(this.board, piece.shape, piece.column, piece.row)) {
      this.lives = 0;
      this.finishGame();
    }
  }

  // ── Draw ──────────────────────────────────────────────────────────────────────

  private draw(): void {
    drawBlockStack(
      this.context,
      {
        board: this.board,
        currentPiece: this.currentPiece,
        ghostRow: findLandingRow(this.board, this.currentPiece),
        nextPiece: this.nextPiece,
        clearedLineCount: this.clearedLineCount,
        clockSeconds: this.clockSeconds,
      },
      SKINS[this.skinId],
    );
  }
}

export const createBlockStackEngine: GameEngineFactory = (canvas, callbacks) =>
  new BlockStackEngine(canvas, callbacks);
