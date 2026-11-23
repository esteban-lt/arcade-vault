import { CANVAS_HEIGHT, CANVAS_WIDTH } from "../shared/canvas";
import { wrapCoordinate } from "../shared/math";
import { snapToGrid } from "./skin-draw";
import type { AsteroidsSkin } from "./skins";

const BULLET_SPEED = 520;
const BULLET_LIFETIME_SECONDS = 1.1;
const BULLET_RADIUS = 2; // hit radius; the drawn size comes from the skin

export class Bullet {
  x: number;
  y: number;
  readonly radius = BULLET_RADIUS;
  isDead = false;
  private readonly velocityX: number;
  private readonly velocityY: number;
  private remainingLifetimeSeconds = BULLET_LIFETIME_SECONDS;

  constructor(x: number, y: number, angle: number) {
    this.x = x;
    this.y = y;
    this.velocityX = Math.cos(angle) * BULLET_SPEED;
    this.velocityY = Math.sin(angle) * BULLET_SPEED;
  }

  update(deltaSeconds: number): void {
    this.x = wrapCoordinate(this.x + this.velocityX * deltaSeconds, CANVAS_WIDTH);
    this.y = wrapCoordinate(this.y + this.velocityY * deltaSeconds, CANVAS_HEIGHT);
    this.remainingLifetimeSeconds -= deltaSeconds;
    if (this.remainingLifetimeSeconds <= 0) this.isDead = true;
  }

  draw(context: CanvasRenderingContext2D, skin: AsteroidsSkin): void {
    context.save();
    context.fillStyle = skin.bulletColor;
    if (skin.glowBlurPixels > 0) {
      context.shadowColor = skin.bulletColor;
      context.shadowBlur = skin.glowBlurPixels;
    }
    if (skin.bulletShape === "cross") {
      const arm = skin.bulletSizePixels;
      context.strokeStyle = skin.bulletColor;
      context.lineWidth = 1.5;
      context.beginPath();
      context.moveTo(this.x - arm, this.y);
      context.lineTo(this.x + arm, this.y);
      context.moveTo(this.x, this.y - arm);
      context.lineTo(this.x, this.y + arm);
      context.stroke();
    } else if (skin.bulletShape === "square") {
      const side = skin.bulletSizePixels;
      const grid = skin.pixelSizePixels;
      context.fillRect(snapToGrid(this.x - side / 2, grid), snapToGrid(this.y - side / 2, grid), side, side);
    } else {
      context.beginPath();
      context.arc(this.x, this.y, skin.bulletSizePixels, 0, Math.PI * 2);
      context.fill();
    }
    context.restore();
  }
}
