import { CANVAS_HEIGHT, CANVAS_WIDTH } from "../shared/canvas";
import { POWER_UP_LIFETIME_SECONDS } from "./constants";
import { randomBetween, wrapCoordinate } from "../shared/math";
import { resolveFont, strokePath, type Point } from "./skin-draw";
import type { AsteroidsSkin } from "./skins";

const POWER_UP_RADIUS = 12;
const BLINK_WHEN_REMAINING_BELOW_SECONDS = 2;

// Triple-shot pickup: drifts slowly, blinks before it expires.
export class PowerUp {
  x: number;
  y: number;
  readonly radius = POWER_UP_RADIUS;
  isDead = false;
  private readonly velocityX: number;
  private readonly velocityY: number;
  private remainingLifetimeSeconds = POWER_UP_LIFETIME_SECONDS;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    const angle = randomBetween(0, Math.PI * 2);
    const speed = randomBetween(20, 40);
    this.velocityX = Math.cos(angle) * speed;
    this.velocityY = Math.sin(angle) * speed;
  }

  update(deltaSeconds: number): void {
    this.x = wrapCoordinate(this.x + this.velocityX * deltaSeconds, CANVAS_WIDTH);
    this.y = wrapCoordinate(this.y + this.velocityY * deltaSeconds, CANVAS_HEIGHT);
    this.remainingLifetimeSeconds -= deltaSeconds;
    if (this.remainingLifetimeSeconds <= 0) this.isDead = true;
  }

  draw(context: CanvasRenderingContext2D, skin: AsteroidsSkin): void {
    const isBlinkedOut =
      this.remainingLifetimeSeconds < BLINK_WHEN_REMAINING_BELOW_SECONDS &&
      Math.floor(this.remainingLifetimeSeconds * 8) % 2 === 0;
    if (isBlinkedOut) return;

    const pulse = 0.85 + Math.sin(performance.now() / 150) * 0.15;
    const reach = this.radius * pulse * Math.SQRT2;
    // A square rotated 45 degrees, given as world-space corners.
    const diamond: Point[] = [
      [this.x, this.y - reach],
      [this.x + reach, this.y],
      [this.x, this.y + reach],
      [this.x - reach, this.y],
    ];
    strokePath(context, skin, diamond, skin.powerUpColor, skin.powerUpLineWidthPixels, true, skin.powerUpDashPattern);

    context.save();
    context.fillStyle = skin.powerUpColor;
    if (skin.glowBlurPixels > 0) {
      context.shadowColor = skin.powerUpColor;
      context.shadowBlur = skin.glowBlurPixels / 2;
    }
    context.font = resolveFont(skin, skin.powerUpFontWeight, skin.powerUpFontSizePixels);
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText("3x", this.x, this.y);
    context.restore();
  }
}
