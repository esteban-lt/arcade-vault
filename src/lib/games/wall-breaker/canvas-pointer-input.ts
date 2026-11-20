import { CANVAS_WIDTH } from "../shared/canvas";

// Mouse input over the game canvas only. It records the latest cursor x in logical pixels
// (the canvas is scaled by CSS, so the rendered size can differ from CANVAS_WIDTH).
export class CanvasPointerInput {
  private readonly canvas: HTMLCanvasElement;
  private pendingTargetX: number | null = null;
  private isAttached = false;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
  }

  attach(): void {
    if (this.isAttached) return;
    this.isAttached = true;
    this.canvas.addEventListener("mousemove", this.handleMouseMove);
  }

  detach(): void {
    if (!this.isAttached) return;
    this.isAttached = false;
    this.canvas.removeEventListener("mousemove", this.handleMouseMove);
    this.pendingTargetX = null;
  }

  // Last cursor x since the previous call, or null when the mouse has not moved.
  consumeTargetX(): number | null {
    const targetX = this.pendingTargetX;
    this.pendingTargetX = null;
    return targetX;
  }

  private readonly handleMouseMove = (event: MouseEvent): void => {
    const rectangle = this.canvas.getBoundingClientRect();
    if (rectangle.width === 0) return;
    this.pendingTargetX = ((event.clientX - rectangle.left) * CANVAS_WIDTH) / rectangle.width;
  };
}
