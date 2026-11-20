import type { KeyboardInput } from "../shared/keyboard-input";
import { KEY_REPEAT_DELAY_SECONDS, KEY_REPEAT_INTERVAL_SECONDS } from "./constants";

// Replaces the OS auto-repeat (KeyboardInput reports one press per physical press):
// a key fires on press, again after KEY_REPEAT_DELAY_SECONDS while held, then every
// KEY_REPEAT_INTERVAL_SECONDS. Timers only advance through update(), so they stop while paused.
export class HeldKeyRepeater {
  private readonly input: KeyboardInput;
  private readonly keyCodes: readonly string[];
  // Seconds left until the next repeat, only for keys whose press was processed.
  private readonly secondsUntilRepeatByKeyCode = new Map<string, number>();

  constructor(input: KeyboardInput, keyCodes: readonly string[]) {
    this.input = input;
    this.keyCodes = keyCodes;
  }

  // Key codes whose action must run this frame, in keyCodes order (a key may appear more than once).
  update(deltaSeconds: number): string[] {
    const firedKeyCodes: string[] = [];
    for (const keyCode of this.keyCodes) {
      if (this.input.consumePress(keyCode)) {
        firedKeyCodes.push(keyCode);
        this.secondsUntilRepeatByKeyCode.set(keyCode, KEY_REPEAT_DELAY_SECONDS);
        continue;
      }

      const secondsUntilRepeat = this.secondsUntilRepeatByKeyCode.get(keyCode);
      if (secondsUntilRepeat === undefined) continue;
      if (!this.input.isHeld(keyCode)) {
        this.secondsUntilRepeatByKeyCode.delete(keyCode);
        continue;
      }

      let remainingSeconds = secondsUntilRepeat - deltaSeconds;
      while (remainingSeconds <= 0) {
        firedKeyCodes.push(keyCode);
        remainingSeconds += KEY_REPEAT_INTERVAL_SECONDS;
      }
      this.secondsUntilRepeatByKeyCode.set(keyCode, remainingSeconds);
    }
    return firedKeyCodes;
  }

  reset(): void {
    this.secondsUntilRepeatByKeyCode.clear();
  }
}
