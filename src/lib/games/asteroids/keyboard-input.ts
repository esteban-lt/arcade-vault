// Keys the game uses. While input is attached, the browser's default action for them
// (page scroll, "click" on a focused button) is suppressed.
const GAME_KEY_CODES: ReadonlySet<string> = new Set([
  "ArrowLeft",
  "ArrowRight",
  "ArrowUp",
  "ArrowDown",
  "Space",
]);

function isTextEntryTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target.isContentEditable
  );
}

export class KeyboardInput {
  private readonly heldKeyCodes = new Set<string>();
  private readonly pressedKeyCodes = new Set<string>();
  private isAttached = false;

  attach(): void {
    if (this.isAttached) return;
    this.isAttached = true;
    window.addEventListener("keydown", this.handleKeyDown);
    window.addEventListener("keyup", this.handleKeyUp);
  }

  detach(): void {
    if (!this.isAttached) return;
    this.isAttached = false;
    window.removeEventListener("keydown", this.handleKeyDown);
    window.removeEventListener("keyup", this.handleKeyUp);
    this.heldKeyCodes.clear();
    this.pressedKeyCodes.clear();
  }

  isHeld(keyCode: string): boolean {
    return this.heldKeyCodes.has(keyCode);
  }

  // True once per physical key press (single-frame), then false until pressed again.
  consumePress(keyCode: string): boolean {
    return this.pressedKeyCodes.delete(keyCode);
  }

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    if (isTextEntryTarget(event.target)) return;
    if (GAME_KEY_CODES.has(event.code)) event.preventDefault();
    if (!this.heldKeyCodes.has(event.code)) this.pressedKeyCodes.add(event.code);
    this.heldKeyCodes.add(event.code);
  };

  private readonly handleKeyUp = (event: KeyboardEvent): void => {
    if (isTextEntryTarget(event.target)) return;
    if (GAME_KEY_CODES.has(event.code)) event.preventDefault();
    this.heldKeyCodes.delete(event.code);
  };
}
