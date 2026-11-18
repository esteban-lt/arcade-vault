import { CANVAS_HEIGHT, CANVAS_WIDTH, POWER_UP_LIFETIME_SECONDS } from "./constants";
import { randomBetween, wrapCoordinate } from "./math";

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

  draw(context: CanvasRenderingContext2D): void {
    const isBlinkedOut =
      this.remainingLifetimeSeconds < BLINK_WHEN_REMAINING_BELOW_SECONDS &&
      Math.floor(this.remainingLifetimeSeconds * 8) % 2 === 0;
    if (isBlinkedOut) return;

    const pulse = 0.85 + Math.sin(performance.now() / 150) * 0.15;
    const pulsingRadius = this.radius * pulse;
    context.save();
    context.translate(this.x, this.y);
    context.rotate(Math.PI / 4);
    context.strokeStyle = "#0ff";
    context.lineWidth = 2;
    context.strokeRect(-pulsingRadius, -pulsingRadius, pulsingRadius * 2, pulsingRadius * 2);
    context.restore();

    context.fillStyle = "#0ff";
    context.font = "bold 12px monospace";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText("3x", this.x, this.y);
  }
}
