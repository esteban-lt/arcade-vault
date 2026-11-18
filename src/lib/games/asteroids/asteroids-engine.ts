import { Asteroid } from "./asteroid";
import type { Bullet } from "./bullet";
import {
  ASTEROID_POINTS_BY_SIZE,
  ASTEROID_SAFE_DISTANCE,
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  INITIAL_ASTEROID_COUNT,
  INITIAL_LIVES,
  MAXIMUM_FRAME_SECONDS,
  POWER_UP_DROP_CHANCE,
  POWER_UP_DURATION_SECONDS,
  POWER_UP_GUARANTEED_AFTER_KILLS,
  RESPAWN_DELAY_SECONDS,
  SHIP_COLLISION_RADIUS_FACTOR,
} from "./constants";
import type { GameEngine, GameEngineCallbacks, GameEngineFactory, GameSnapshot } from "../game-engine";
import { KeyboardInput } from "./keyboard-input";
import { distanceBetween, randomBetween } from "./math";
import { Particle } from "./particle";
import { PowerUp } from "./power-up";
import { Ship } from "./ship";

type AsteroidsPhase = "playing" | "respawning" | "game-over"; // "respawning" was 'dead' in game.js

const SHIP_EXPLOSION_PARTICLE_COUNT = 14;
const PARTICLES_PER_ASTEROID_SIZE = 5;

class AsteroidsEngine implements GameEngine {
  private readonly context: CanvasRenderingContext2D;
  private readonly callbacks: GameEngineCallbacks;
  private readonly input = new KeyboardInput();

  private ship = new Ship();
  private bullets: Bullet[] = [];
  private asteroids: Asteroid[] = [];
  private particles: Particle[] = [];
  private powerUps: PowerUp[] = [];
  private score = 0;
  private lives = INITIAL_LIVES;
  private level = 1;
  private phase: AsteroidsPhase = "playing";
  private respawnSecondsRemaining = 0;
  private hasPowerUpSpawnedThisLevel = false;
  private killsSinceLastPowerUp = 0;

  private isPaused = false;
  private animationFrameId: number | null = null;
  private lastTimestamp: number | null = null;
  private lastEmittedSnapshot: GameSnapshot | null = null;

  constructor(canvas: HTMLCanvasElement, callbacks: GameEngineCallbacks) {
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Asteroids: the 2D canvas context is not available.");
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

  // ── Game state ────────────────────────────────────────────────────────────────

  private startNewGame(): void {
    this.ship = new Ship();
    this.bullets = [];
    this.asteroids = [];
    this.particles = [];
    this.powerUps = [];
    this.hasPowerUpSpawnedThisLevel = false;
    this.killsSinceLastPowerUp = 0;
    this.score = 0;
    this.lives = INITIAL_LIVES;
    this.level = 1;
    this.phase = "playing";
    this.lastTimestamp = null;
    this.spawnAsteroids(INITIAL_ASTEROID_COUNT);
    this.input.attach();
    this.emitSnapshotIfChanged();
  }

  private startNextLevel(): void {
    this.level++;
    this.bullets = [];
    this.particles = [];
    this.powerUps = [];
    this.hasPowerUpSpawnedThisLevel = false;
    this.killsSinceLastPowerUp = 0;
    this.ship.reset();
    this.spawnAsteroids(3 + this.level);
  }

  private spawnAsteroids(count: number): void {
    for (let index = 0; index < count; index++) {
      let x: number;
      let y: number;
      do {
        x = randomBetween(0, CANVAS_WIDTH);
        y = randomBetween(0, CANVAS_HEIGHT);
      } while (Math.hypot(x - CANVAS_WIDTH / 2, y - CANVAS_HEIGHT / 2) < ASTEROID_SAFE_DISTANCE);
      this.asteroids.push(new Asteroid(x, y, 3));
    }
  }

  private explode(x: number, y: number, particleCount: number): void {
    for (let index = 0; index < particleCount; index++) this.particles.push(new Particle(x, y));
  }

  private killShip(): void {
    this.explode(this.ship.x, this.ship.y, SHIP_EXPLOSION_PARTICLE_COUNT);
    this.ship.isDead = true;
    this.lives--;
    if (this.lives <= 0) {
      this.finishGame();
    } else {
      this.phase = "respawning";
      this.respawnSecondsRemaining = RESPAWN_DELAY_SECONDS;
    }
  }

  // Stops reading the keyboard and reports the final score exactly once per game.
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
    const snapshot: GameSnapshot = { score: this.score, lives: this.lives, level: this.level };
    this.lastEmittedSnapshot = snapshot;
    this.callbacks.onSnapshotChange(snapshot);
  }

  // ── Update ────────────────────────────────────────────────────────────────────

  private readonly loop = (timestamp: number): void => {
    if (this.isPaused) {
      // Forget the timestamp so resuming does not count the paused time, and discard
      // key presses made while paused so they do not fire when the game resumes.
      this.lastTimestamp = null;
      this.input.consumePress("Space");
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
    if (this.phase === "game-over") {
      this.updateParticles(deltaSeconds);
      return;
    }

    if (this.phase === "respawning") {
      this.respawnSecondsRemaining -= deltaSeconds;
      this.updateParticles(deltaSeconds);
      this.asteroids.forEach((asteroid) => asteroid.update(deltaSeconds));
      if (this.respawnSecondsRemaining <= 0) {
        this.phase = "playing";
        this.ship.reset();
      }
      return;
    }

    if (this.input.consumePress("Space")) this.bullets.push(...this.ship.tryShoot());

    this.ship.update(deltaSeconds, this.input);
    this.bullets.forEach((bullet) => bullet.update(deltaSeconds));
    this.asteroids.forEach((asteroid) => asteroid.update(deltaSeconds));
    this.particles.forEach((particle) => particle.update(deltaSeconds));
    this.powerUps.forEach((powerUp) => powerUp.update(deltaSeconds));

    this.bullets = this.bullets.filter((bullet) => !bullet.isDead);
    this.particles = this.particles.filter((particle) => !particle.isDead);
    this.powerUps = this.powerUps.filter((powerUp) => !powerUp.isDead);

    this.collectPowerUps();
    this.resolveBulletHits();
    this.resolveShipCollision();

    if (this.asteroids.length === 0) this.startNextLevel();
  }

  private updateParticles(deltaSeconds: number): void {
    this.particles.forEach((particle) => particle.update(deltaSeconds));
    this.particles = this.particles.filter((particle) => !particle.isDead);
  }

  private collectPowerUps(): void {
    for (const powerUp of this.powerUps) {
      if (!powerUp.isDead && distanceBetween(this.ship, powerUp) < this.ship.radius + powerUp.radius) {
        powerUp.isDead = true;
        this.ship.tripleShotSecondsRemaining = POWER_UP_DURATION_SECONDS;
      }
    }
  }

  private resolveBulletHits(): void {
    const splitAsteroids: Asteroid[] = [];
    for (const bullet of this.bullets) {
      for (const asteroid of this.asteroids) {
        if (asteroid.isDead || bullet.isDead || distanceBetween(bullet, asteroid) >= asteroid.radius) continue;
        bullet.isDead = true;
        asteroid.isDead = true;
        this.score += ASTEROID_POINTS_BY_SIZE[asteroid.size];
        this.explode(asteroid.x, asteroid.y, asteroid.size * PARTICLES_PER_ASTEROID_SIZE);
        splitAsteroids.push(...asteroid.split());
        this.maybeDropPowerUp(asteroid.x, asteroid.y);
      }
    }
    this.asteroids = this.asteroids.filter((asteroid) => !asteroid.isDead).concat(splitAsteroids);
    this.bullets = this.bullets.filter((bullet) => !bullet.isDead);
  }

  // One power-up per level: random chance per kill, guaranteed after enough kills.
  private maybeDropPowerUp(x: number, y: number): void {
    if (this.hasPowerUpSpawnedThisLevel) return;
    this.killsSinceLastPowerUp++;
    const isGuaranteed = this.killsSinceLastPowerUp >= POWER_UP_GUARANTEED_AFTER_KILLS;
    if (isGuaranteed || Math.random() < POWER_UP_DROP_CHANCE) {
      this.powerUps.push(new PowerUp(x, y));
      this.hasPowerUpSpawnedThisLevel = true;
    }
  }

  private resolveShipCollision(): void {
    if (this.ship.invincibleSecondsRemaining > 0) return;
    for (const asteroid of this.asteroids) {
      if (distanceBetween(this.ship, asteroid) < this.ship.radius + asteroid.radius * SHIP_COLLISION_RADIUS_FACTOR) {
        this.killShip();
        break;
      }
    }
  }

  // ── Draw ──────────────────────────────────────────────────────────────────────
  // Score, lives, level and GAME OVER are shown by the player UI, not by the canvas.

  private draw(): void {
    const { context } = this;
    context.fillStyle = "#000";
    context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    this.particles.forEach((particle) => particle.draw(context));
    this.asteroids.forEach((asteroid) => asteroid.draw(context));
    this.powerUps.forEach((powerUp) => powerUp.draw(context));
    this.bullets.forEach((bullet) => bullet.draw(context));
    this.ship.draw(context);

    this.drawTripleShotIndicator();
  }

  private drawTripleShotIndicator(): void {
    if (this.ship.tripleShotSecondsRemaining <= 0) return;
    const { context } = this;
    context.fillStyle = "#0ff";
    context.font = "15px monospace";
    context.textAlign = "left";
    context.textBaseline = "alphabetic";
    context.fillText(`3x  ${this.ship.tripleShotSecondsRemaining.toFixed(1)}s`, 14, 26);
  }
}

export const createAsteroidsEngine: GameEngineFactory = (canvas, callbacks) =>
  new AsteroidsEngine(canvas, callbacks);
