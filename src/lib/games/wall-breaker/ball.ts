import { CANVAS_WIDTH } from "../shared/canvas";
import {
  BALL_COLOR,
  BALL_SIZE_PIXELS,
  BASE_BALL_HORIZONTAL_VELOCITY_PIXELS_PER_SECOND,
  BASE_BALL_VERTICAL_VELOCITY_PIXELS_PER_SECOND,
} from "./constants";
import type { Paddle } from "./paddle";

// Position is the top-left corner of the 16×16 box used for every collision.
export class Ball {
  x = 0;
  y = 0;
  readonly width = BALL_SIZE_PIXELS;
  readonly height = BALL_SIZE_PIXELS;
  horizontalVelocity = 0;
  verticalVelocity = 0;

  // Resting on top of the paddle, centered on it, already moving up and to the right (no serve).
  resetOnPaddle(paddle: Paddle, ballSpeedMultiplier: number): void {
    this.x = paddle.x + (paddle.width - this.width) / 2;
    this.y = paddle.y - this.height;
    this.horizontalVelocity = BASE_BALL_HORIZONTAL_VELOCITY_PIXELS_PER_SECOND * ballSpeedMultiplier;
    this.verticalVelocity = BASE_BALL_VERTICAL_VELOCITY_PIXELS_PER_SECOND * ballSpeedMultiplier;
  }

  move(deltaSeconds: number): void {
    this.x += this.horizontalVelocity * deltaSeconds;
    this.y += this.verticalVelocity * deltaSeconds;
  }

  // Left, right and top walls: back inside the edge, velocity forced inwards. The bottom is open.
  bounceOffWalls(): void {
    if (this.x <= 0) {
      this.x = 0;
      this.horizontalVelocity = Math.abs(this.horizontalVelocity);
    }
    if (this.x + this.width >= CANVAS_WIDTH) {
      this.x = CANVAS_WIDTH - this.width;
      this.horizontalVelocity = -Math.abs(this.horizontalVelocity);
    }
    if (this.y <= 0) {
      this.y = 0;
      this.verticalVelocity = Math.abs(this.verticalVelocity);
    }
  }

  draw(context: CanvasRenderingContext2D): void {
    context.fillStyle = BALL_COLOR;
    context.beginPath();
    context.arc(this.x + this.width / 2, this.y + this.height / 2, this.width / 2, 0, Math.PI * 2);
    context.fill();
  }
}
