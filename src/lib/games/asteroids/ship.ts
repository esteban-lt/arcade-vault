import { Bullet } from "./bullet";
import { CANVAS_HEIGHT, CANVAS_WIDTH } from "../shared/canvas";
import {
  SPAWN_INVINCIBILITY_SECONDS,
  TRIPLE_SHOT_SPREAD_RADIANS,
} from "./constants";
import type { KeyboardInput } from "../shared/keyboard-input";
import { randomBetween, wrapCoordinate } from "../shared/math";

const ROTATION_SPEED_RADIANS_PER_SECOND = 3.5;
const THRUST_PIXELS_PER_SECOND_SQUARED = 260;
const DRAG_PER_FRAME = 0.987; // applied once per update, as in the original
const SHOOT_COOLDOWN_SECONDS = 0.2;
const NOSE_DISTANCE = 21; // where bullets leave the ship
const SHIP_RADIUS = 12;

export class Ship {
  x = CANVAS_WIDTH / 2;
  y = CANVAS_HEIGHT / 2;
  angle = -Math.PI / 2;
  readonly radius = SHIP_RADIUS;
  isDead = false;
  invincibleSecondsRemaining = SPAWN_INVINCIBILITY_SECONDS;
  // Survives reset(): a level change or a respawn does not cancel the power-up.
  tripleShotSecondsRemaining = 0;
  private velocityX = 0;
  private velocityY = 0;
  private isThrusting = false;
  private shootCooldownSecondsRemaining = 0;

  reset(): void {
    this.x = CANVAS_WIDTH / 2;
    this.y = CANVAS_HEIGHT / 2;
    this.angle = -Math.PI / 2;
    this.velocityX = 0;
    this.velocityY = 0;
    this.isThrusting = false;
    this.invincibleSecondsRemaining = SPAWN_INVINCIBILITY_SECONDS;
    this.shootCooldownSecondsRemaining = 0;
    this.isDead = false;
  }

  update(deltaSeconds: number, input: KeyboardInput): void {
    if (this.isDead) return;
    if (this.invincibleSecondsRemaining > 0) this.invincibleSecondsRemaining -= deltaSeconds;
    if (this.shootCooldownSecondsRemaining > 0) this.shootCooldownSecondsRemaining -= deltaSeconds;
    if (this.tripleShotSecondsRemaining > 0) this.tripleShotSecondsRemaining -= deltaSeconds;

    if (input.isHeld("ArrowLeft")) this.angle -= ROTATION_SPEED_RADIANS_PER_SECOND * deltaSeconds;
    if (input.isHeld("ArrowRight")) this.angle += ROTATION_SPEED_RADIANS_PER_SECOND * deltaSeconds;

    this.isThrusting = input.isHeld("ArrowUp");
    if (this.isThrusting) {
      this.velocityX += Math.cos(this.angle) * THRUST_PIXELS_PER_SECOND_SQUARED * deltaSeconds;
      this.velocityY += Math.sin(this.angle) * THRUST_PIXELS_PER_SECOND_SQUARED * deltaSeconds;
    }

    this.velocityX *= DRAG_PER_FRAME;
    this.velocityY *= DRAG_PER_FRAME;
    this.x = wrapCoordinate(this.x + this.velocityX * deltaSeconds, CANVAS_WIDTH);
    this.y = wrapCoordinate(this.y + this.velocityY * deltaSeconds, CANVAS_HEIGHT);
  }

  tryShoot(): Bullet[] {
    if (this.shootCooldownSecondsRemaining > 0 || this.isDead) return [];
    this.shootCooldownSecondsRemaining = SHOOT_COOLDOWN_SECONDS;
    const originX = this.x + Math.cos(this.angle) * NOSE_DISTANCE;
    const originY = this.y + Math.sin(this.angle) * NOSE_DISTANCE;
    if (this.tripleShotSecondsRemaining > 0) {
      return [
        new Bullet(originX, originY, this.angle - TRIPLE_SHOT_SPREAD_RADIANS),
        new Bullet(originX, originY, this.angle),
        new Bullet(originX, originY, this.angle + TRIPLE_SHOT_SPREAD_RADIANS),
      ];
    }
    return [new Bullet(originX, originY, this.angle)];
  }

  draw(context: CanvasRenderingContext2D): void {
    if (this.isDead) return;
    // Blink while invincible after spawning.
    if (this.invincibleSecondsRemaining > 0 && Math.floor(this.invincibleSecondsRemaining * 8) % 2 === 0) {
      return;
    }

    context.save();
    context.translate(this.x, this.y);
    context.rotate(this.angle);
    context.strokeStyle = "#fff";
    context.lineWidth = 1.5;
    context.lineJoin = "round";

    // Classic silhouette: triangle with a rear notch.
    context.beginPath();
    context.moveTo(20, 0); // nose
    context.lineTo(-12, -9); // left wing
    context.lineTo(-7, 0); // rear notch
    context.lineTo(-12, 9); // right wing
    context.closePath();
    context.stroke();

    // Thruster flame, flickering.
    if (this.isThrusting && Math.random() > 0.35) {
      context.beginPath();
      context.moveTo(-8, -4);
      context.lineTo(-8 - randomBetween(6, 14), 0);
      context.lineTo(-8, 4);
      context.strokeStyle = "rgba(255, 130, 0, 0.85)";
      context.stroke();
    }

    context.restore();
  }
}
