import { CANVAS_HEIGHT, CANVAS_WIDTH } from "./constants";
import { wrapCoordinate } from "./math";

const BULLET_SPEED = 520;
const BULLET_LIFETIME_SECONDS = 1.1;
const BULLET_RADIUS = 2;

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

  draw(context: CanvasRenderingContext2D): void {
    context.fillStyle = "#fff";
    context.beginPath();
    context.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    context.fill();
  }
}
