import type { GameEngine, GameEngineCallbacks, GameEngineFactory, GameSnapshot } from "../game-engine";
import { CANVAS_HEIGHT, MAXIMUM_FRAME_SECONDS } from "../shared/canvas";
import { KeyboardInput } from "../shared/keyboard-input";
import { Ball } from "./ball";
import { Block, createLevelBlocks, Explosion, rectanglesOverlap } from "./block";
import { CanvasPointerInput } from "./canvas-pointer-input";
import { GAME_KEY_CODES, INITIAL_LIVES, PADDLE_BOUNCE_TOLERANCE_PIXELS, POINTS_PER_BLOCK } from "./constants";
import { LEVEL_DEFINITIONS } from "./levels";
import { Paddle } from "./paddle";
import { applySmoothing, drawBackground } from "./skin-draw";
import { DEFAULT_SKIN_ID, SKINS, type SkinId } from "./skins";

type WallBreakerPhase = "playing" | "game-over";

class WallBreakerEngine implements GameEngine {
  private readonly context: CanvasRenderingContext2D;
  private readonly callbacks: GameEngineCallbacks;
  private readonly input = new KeyboardInput(GAME_KEY_CODES);
  private readonly pointerInput: CanvasPointerInput;

  private readonly paddle = new Paddle();
  private readonly ball = new Ball();
  private blocks: Block[] = [];
  private explosions: Explosion[] = [];
  private score = 0;
  private lives = INITIAL_LIVES;
  private level = 1; // 1–5, index + 1 into LEVEL_DEFINITIONS
  private phase: WallBreakerPhase = "playing";

  private isPaused = false;
  private animationFrameId: number | null = null;
  private lastTimestamp: number | null = null;
  private lastEmittedSnapshot: GameSnapshot | null = null;

  private skinId: SkinId = DEFAULT_SKIN_ID;
  private clockSeconds = 0; // visual only: drives the animated backdrop of the experimental skin

  constructor(canvas: HTMLCanvasElement, callbacks: GameEngineCallbacks) {
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Wall Breaker: the 2D canvas context is not available.");
    this.context = context;
    this.callbacks = callbacks;
    this.pointerInput = new CanvasPointerInput(canvas);
  }

  start(): void {
    if (this.animationFrameId !== null) return;
    this.startNewGame();
    this.animationFrameId = requestAnimationFrame(this.loop);
  }

  // The loop redraws every frame, also while paused and after game over, so the new skin shows at once.
  setSkin(skinId: SkinId): void {
    this.skinId = skinId;
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
    this.pointerInput.detach();
  }

  // ── Game state ────────────────────────────────────────────────────────────────

  private startNewGame(): void {
    this.score = 0;
    this.lives = INITIAL_LIVES;
    this.phase = "playing";
    this.paddle.resetPosition();
    this.loadLevel(1);
    this.lastTimestamp = null;
    // Always emit: the player has just reset its HUD to its own defaults.
    this.lastEmittedSnapshot = null;
    this.input.attach();
    this.pointerInput.attach();
    this.emitSnapshotIfChanged();
  }

  // The paddle stays where it is; the ball goes back on top of it with the new level's speed.
  private loadLevel(level: number): void {
    this.level = level;
    this.blocks = createLevelBlocks(this.currentLevelDefinition());
    this.explosions = [];
    this.ball.resetOnPaddle(this.paddle, this.currentLevelDefinition().ballSpeedMultiplier);
  }

  private currentLevelDefinition() {
    return LEVEL_DEFINITIONS[this.level - 1];
  }

  private finishGame(): void {
    this.phase = "game-over";
    this.input.detach();
    this.pointerInput.detach();
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
      // mouse moves made while paused so the paddle does not jump when the game resumes.
      this.lastTimestamp = null;
      this.pointerInput.consumeTargetX();
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

  // Frame order of the original: paddle, ball movement, walls, paddle bounce, blocks,
  // explosions, lost ball. After game over only the explosions finish animating.
  private update(deltaSeconds: number): void {
    if (this.isGameOver()) {
      this.updateExplosions(deltaSeconds);
      return;
    }

    this.paddle.update(deltaSeconds, this.input, this.pointerInput.consumeTargetX());
    this.ball.move(deltaSeconds);
    this.ball.bounceOffWalls();
    this.bounceBallOffPaddle();

    this.breakFirstTouchedBlock();
    if (this.isGameOver()) return; // the last block of level 5 ends the game in this frame

    this.updateExplosions(deltaSeconds);
    this.handleLostBall();
  }

  // A method instead of an inline comparison: actions can end the game mid-update,
  // and TypeScript would keep this.phase narrowed to "playing".
  private isGameOver(): boolean {
    return this.phase === "game-over";
  }

  // Only while the ball goes down, overlapping the paddle horizontally, with its bottom edge
  // between the paddle top and PADDLE_BOUNCE_TOLERANCE_PIXELS below the paddle bottom.
  // Only the vertical velocity flips, so the angle never changes.
  private bounceBallOffPaddle(): void {
    const ball = this.ball;
    const paddle = this.paddle;
    const ballBottom = ball.y + ball.height;
    if (
      ball.verticalVelocity > 0 &&
      ball.x + ball.width > paddle.x &&
      ball.x < paddle.x + paddle.width &&
      ballBottom >= paddle.y &&
      ballBottom <= paddle.y + paddle.height + PADDLE_BOUNCE_TOLERANCE_PIXELS
    ) {
      ball.y = paddle.y - ball.height;
      ball.verticalVelocity = -Math.abs(ball.verticalVelocity);
    }
  }

  // At most one block per frame: the first one, in level order, that the ball overlaps.
  private breakFirstTouchedBlock(): void {
    const block = this.blocks.find((candidate) => !candidate.isDestroyed && rectanglesOverlap(this.ball, candidate));
    if (!block) return;

    block.isDestroyed = true;
    this.explosions.push(new Explosion(block));
    this.score += POINTS_PER_BLOCK;
    this.ball.verticalVelocity = -this.ball.verticalVelocity;

    if (this.blocks.some((candidate) => !candidate.isDestroyed)) return;
    if (this.level < LEVEL_DEFINITIONS.length) {
      this.loadLevel(this.level + 1);
    } else {
      this.finishGame();
    }
  }

  private updateExplosions(deltaSeconds: number): void {
    for (const explosion of this.explosions) explosion.update(deltaSeconds);
    this.explosions = this.explosions.filter((explosion) => !explosion.isDead);
  }

  // Below the bottom edge: one life less. The ball goes back on the paddle, which does not move.
  private handleLostBall(): void {
    if (this.ball.y <= CANVAS_HEIGHT) return;
    this.lives--;
    if (this.lives <= 0) {
      this.lives = 0;
      this.finishGame();
    } else {
      this.ball.resetOnPaddle(this.paddle, this.currentLevelDefinition().ballSpeedMultiplier);
    }
  }

  // ── Draw ──────────────────────────────────────────────────────────────────────

  // Entities only: no score, lives, level, pause, game over or victory text.
  private draw(): void {
    const context = this.context;
    const skin = SKINS[this.skinId];
    applySmoothing(context, skin);
    drawBackground(context, skin, this.clockSeconds);
    for (const block of this.blocks) {
      if (!block.isDestroyed) block.draw(context, skin);
    }
    for (const explosion of this.explosions) explosion.draw(context, skin);
    this.paddle.draw(context, skin);
    this.ball.draw(context, skin);
  }
}

export const createWallBreakerEngine: GameEngineFactory = (canvas, callbacks) =>
  new WallBreakerEngine(canvas, callbacks);
