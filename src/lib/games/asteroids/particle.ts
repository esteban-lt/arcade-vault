import { randomBetween } from "../shared/math";
import { snapToGrid } from "./skin-draw";
import type { AsteroidsSkin } from "./skins";

const TRAIL_LENGTH_FACTOR = 0.05;

// Explosion debris: a short fading line that is not wrapped around the screen.
export class Particle {
  x: number;
  y: number;
  isDead = false;
  private readonly velocityX: number;
  private readonly velocityY: number;
  private readonly totalLifetimeSeconds: number;
  private remainingLifetimeSeconds: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    const angle = randomBetween(0, Math.PI * 2);
    const speed = randomBetween(30, 130);
    this.velocityX = Math.cos(angle) * speed;
    this.velocityY = Math.sin(angle) * speed;
    this.totalLifetimeSeconds = randomBetween(0.4, 1.1);
    this.remainingLifetimeSeconds = this.totalLifetimeSeconds;
  }

  update(deltaSeconds: number): void {
    this.x += this.velocityX * deltaSeconds;
    this.y += this.velocityY * deltaSeconds;
    this.remainingLifetimeSeconds -= deltaSeconds;
    if (this.remainingLifetimeSeconds <= 0) this.isDead = true;
  }

  draw(context: CanvasRenderingContext2D, skin: AsteroidsSkin): void {
    context.save();
    context.globalAlpha = this.remainingLifetimeSeconds / this.totalLifetimeSeconds;
    if (skin.isPixelated) {
      const block = skin.pixelSizePixels;
      context.fillStyle = skin.particleColor;
      context.fillRect(snapToGrid(this.x, block), snapToGrid(this.y, block), block, block);
    } else {
      context.strokeStyle = skin.particleColor;
      context.lineWidth = 1;
      context.beginPath();
      context.moveTo(this.x, this.y);
      context.lineTo(
        this.x - this.velocityX * TRAIL_LENGTH_FACTOR,
        this.y - this.velocityY * TRAIL_LENGTH_FACTOR,
      );
      context.stroke();
    }
    context.restore();
  }
}
