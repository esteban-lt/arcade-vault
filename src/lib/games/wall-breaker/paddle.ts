import { CANVAS_WIDTH } from "../shared/canvas";
import type { KeyboardInput } from "../shared/keyboard-input";
import {
  PADDLE_HEIGHT_PIXELS,
  PADDLE_SPEED_PIXELS_PER_SECOND,
  PADDLE_TOP_PIXELS,
  PADDLE_WIDTH_PIXELS,
} from "./constants";
import { clearGlow, setGlow, snap } from "./skin-draw";
import type { WallBreakerSkin } from "./skins";

const MAXIMUM_PADDLE_X = CANVAS_WIDTH - PADDLE_WIDTH_PIXELS;

function clampPaddleX(x: number): number {
  return Math.max(0, Math.min(MAXIMUM_PADDLE_X, x));
}

export class Paddle {
  x = MAXIMUM_PADDLE_X / 2;
  readonly y = PADDLE_TOP_PIXELS;
  readonly width = PADDLE_WIDTH_PIXELS;
  readonly height = PADDLE_HEIGHT_PIXELS;

  // Centered horizontally, as at the start of every game.
  resetPosition(): void {
    this.x = MAXIMUM_PADDLE_X / 2;
  }

  // The mouse target is applied first (the original moved the paddle on each mousemove),
  // then the held arrow keys.
  update(deltaSeconds: number, input: KeyboardInput, pointerTargetX: number | null): void {
    if (pointerTargetX !== null) this.x = clampPaddleX(pointerTargetX - this.width / 2);
    if (input.isHeld("ArrowLeft")) this.x = clampPaddleX(this.x - PADDLE_SPEED_PIXELS_PER_SECOND * deltaSeconds);
    if (input.isHeld("ArrowRight")) this.x = clampPaddleX(this.x + PADDLE_SPEED_PIXELS_PER_SECOND * deltaSeconds);
  }

  draw(context: CanvasRenderingContext2D, skin: WallBreakerSkin): void {
    const x = snap(skin, this.x);
    const endWidth = skin.paddleEndWidthPixels;
    const width = snap(skin, this.width);
    context.fillStyle = skin.paddleColor;
    if (skin.glowBlurPixels > 0) setGlow(context, skin.paddleColor, skin.glowBlurPixels);
    context.fillRect(x, this.y, width, this.height);
    clearGlow(context);
    context.fillStyle = skin.paddleEndColor;
    context.fillRect(x, this.y, endWidth, this.height);
    context.fillRect(x + width - endWidth, this.y, endWidth, this.height);
  }
}
