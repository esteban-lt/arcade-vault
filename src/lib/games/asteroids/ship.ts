import { Bullet } from "./bullet";
import { CANVAS_HEIGHT, CANVAS_WIDTH } from "../shared/canvas";
import {
  SPAWN_INVINCIBILITY_SECONDS,
  TRIPLE_SHOT_SPREAD_RADIANS,
} from "./constants";
import type { KeyboardInput } from "../shared/keyboard-input";
import { randomBetween, wrapCoordinate } from "../shared/math";
import { drawHeadingLine, strokePath, toWorldPoint, type Point } from "./skin-draw";
import type { AsteroidsSkin } from "./skins";

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

  draw(context: CanvasRenderingContext2D, skin: AsteroidsSkin): void {
    if (this.isDead) return;
    // Blink while invincible after spawning.
    if (this.invincibleSecondsRemaining > 0 && Math.floor(this.invincibleSecondsRemaining * 8) % 2 === 0) {
      return;
    }

    // Blueprint skin: dashed heading line ahead of the nose, under the hull.
    drawHeadingLine(context, skin, this.x + Math.cos(this.angle) * NOSE_DISTANCE, this.y + Math.sin(this.angle) * NOSE_DISTANCE, this.angle);

    const toWorld = (local: Point): Point => toWorldPoint(local, this.x, this.y, this.angle);

    // Classic silhouette: triangle with a rear notch (nose, left wing, rear notch, right wing).
    const hull = ([[20, 0], [-12, -9], [-7, 0], [-12, 9]] as Point[]).map(toWorld);
    strokePath(context, skin, hull, skin.shipColor, skin.shipLineWidthPixels, true);

    // Thruster flame, flickering.
    if (this.isThrusting && Math.random() > 0.35) {
      const flame = ([[-8, -4], [-8 - randomBetween(6, 14), 0], [-8, 4]] as Point[]).map(toWorld);
      strokePath(context, skin, flame, skin.shipFlameColor, skin.shipLineWidthPixels, false);
    }
  }
}
