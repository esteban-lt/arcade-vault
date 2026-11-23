import type { GameEngine, GameEngineCallbacks, GameEngineFactory, GameSnapshot } from "../game-engine";
import { MAXIMUM_FRAME_SECONDS } from "../shared/canvas";
import { KeyboardInput } from "../shared/keyboard-input";
import {
  FRUITS_PER_LEVEL,
  GAME_KEY_CODES,
  INITIAL_LIVES,
  INITIAL_STEP_INTERVAL_SECONDS,
  MINIMUM_STEP_INTERVAL_SECONDS,
  POINTS_PER_FRUIT_PER_LEVEL,
  STEP_INTERVAL_DECREMENT_PER_LEVEL_SECONDS,
  type Direction,
} from "./constants";
import { spawnFruit, type Fruit } from "./fruit";
import { drawBoard } from "./skin-draw";
import { DEFAULT_SKIN_ID, SKINS, type SkinId } from "./skins";
import { Snake } from "./snake";

type FruitSnakePhase = "playing" | "game-over";

const KEY_DIRECTIONS: Readonly<Record<(typeof GAME_KEY_CODES)[number], Direction>> = {
  ArrowUp: "up",
  KeyW: "up",
  ArrowDown: "down",
  KeyS: "down",
  ArrowLeft: "left",
  KeyA: "left",
  ArrowRight: "right",
  KeyD: "right",
};

function stepIntervalSecondsForLevel(level: number): number {
  return Math.max(
    INITIAL_STEP_INTERVAL_SECONDS - STEP_INTERVAL_DECREMENT_PER_LEVEL_SECONDS * (level - 1),
    MINIMUM_STEP_INTERVAL_SECONDS,
  );
}

class FruitSnakeEngine implements GameEngine {
  private readonly canvas: HTMLCanvasElement;
  private readonly context: CanvasRenderingContext2D;
  private skinId: SkinId = DEFAULT_SKIN_ID;
  private readonly callbacks: GameEngineCallbacks;
  private readonly input = new KeyboardInput(GAME_KEY_CODES);

  private snake = new Snake();
  private fruit: Fruit | null = null;
  private score = 0;
  private lives = INITIAL_LIVES;
  private level = 1;
  private fruitsEaten = 0;
  private stepTimerSeconds = 0;
  private phase: FruitSnakePhase = "playing";

  private isPaused = false;
  private animationFrameId: number | null = null;
  private lastTimestamp: number | null = null;
  private lastEmittedSnapshot: GameSnapshot | null = null;

  constructor(canvas: HTMLCanvasElement, callbacks: GameEngineCallbacks) {
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Fruit Snake: the 2D canvas context is not available.");
    this.canvas = canvas;
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

  // The loop redraws every frame, also while paused and after game over, so the new skin shows at once.
  setSkin(skinId: SkinId): void {
    this.skinId = skinId;
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

  // ── Game state ────────────────────────────────────────────────────────────────

  private startNewGame(): void {
    this.snake = new Snake();
    this.fruit = spawnFruit(this.snake);
    this.score = 0;
    this.lives = INITIAL_LIVES;
    this.level = 1;
    this.fruitsEaten = 0;
    this.stepTimerSeconds = 0;
    this.phase = "playing";
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
    if (this.isPaused) {
      // Forget the timestamp so resuming does not count the paused time, and discard
      // turns pressed while paused so the snake does not turn on its own when resuming.
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
    for (const keyCode of GAME_KEY_CODES) {
      if (this.input.consumePress(keyCode)) this.snake.requestTurn(KEY_DIRECTIONS[keyCode]);
    }
    this.stepTimerSeconds += deltaSeconds;
    // The interval is re-read every step: eating can raise the level mid-frame.
    while (this.stepTimerSeconds >= stepIntervalSecondsForLevel(this.level)) {
      this.stepTimerSeconds -= stepIntervalSecondsForLevel(this.level);
      this.step();
      if (this.isGameOver()) return;
    }
  }

  // A method instead of an inline comparison: a step can end the game mid-update,
  // and TypeScript would keep this.phase narrowed to "playing".
  private isGameOver(): boolean {
    return this.phase === "game-over";
  }

  private step(): void {
    const nextCell = this.snake.nextHeadCell();
    const isEating =
      this.fruit !== null &&
      this.fruit.cell.column === nextCell.column &&
      this.fruit.cell.row === nextCell.row;

    if (this.snake.collidesWith(nextCell, isEating)) {
      this.snake.isCrashed = true;
      this.lives = 0;
      this.finishGame();
      return;
    }

    this.snake.advanceTo(nextCell, isEating);
    if (!isEating) return;

    this.score += POINTS_PER_FRUIT_PER_LEVEL * this.level;
    this.fruitsEaten += 1;
    this.level = 1 + Math.floor(this.fruitsEaten / FRUITS_PER_LEVEL);
    this.fruit = spawnFruit(this.snake);
    // Board full: the only way to end the game without crashing.
    if (this.fruit === null) this.finishGame();
  }

  // ── Draw ──────────────────────────────────────────────────────────────────────

  private draw(): void {
    const context = this.context;
    const skin = SKINS[this.skinId];
    drawBoard(context, skin);
    this.fruit?.draw(context, skin);
    this.snake.draw(context, skin);
  }
}

export const createFruitSnakeEngine: GameEngineFactory = (canvas, callbacks) =>
  new FruitSnakeEngine(canvas, callbacks);
