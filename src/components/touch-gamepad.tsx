"use client";

import { useEffect, useRef, type ReactNode } from "react";
import type { TouchControlsConfig } from "@/lib/games/touch-controls-registry";

type TouchGamepadProps = {
  controls: TouchControlsConfig;
  // True while paused or on game over: every button is disabled and every held key is released.
  isDisabled: boolean;
};

type DirectionName = "up" | "down" | "left" | "right";

const DIRECTIONS: readonly { name: DirectionName; rotationDegrees: number; label: string }[] = [
  { name: "up", rotationDegrees: 0, label: "Arriba" },
  { name: "left", rotationDegrees: -90, label: "Izquierda" },
  { name: "down", rotationDegrees: 180, label: "Abajo" },
  { name: "right", rotationDegrees: 90, label: "Derecha" },
];

// One triangle rotated per direction, so the four arrows have exactly the same size
// (font glyphs differ in size between ▲ ◀ ▶ ▼).
function ArrowIcon({ rotationDegrees }: { rotationDegrees: number }) {
  return (
    <svg
      className="touch-icon"
      viewBox="0 0 24 24"
      aria-hidden="true"
      style={{ transform: `rotate(${rotationDegrees}deg)` }}
    >
      <polygon points="12,4 21,19 3,19" fill="currentColor" />
    </svg>
  );
}

type TouchKeyButtonProps = {
  // KeyboardEvent.code sent to window; null = the game does not use this control.
  keyCode: string | null;
  isDisabled: boolean;
  className: string;
  ariaLabel?: string;
  children?: ReactNode;
};

// A button that holds a virtual key while at least one pointer is pressing it. The engines
// already listen to keydown/keyup on window, so no engine needs to know about touch.
function TouchKeyButton({ keyCode, isDisabled, className, ariaLabel, children }: TouchKeyButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const activePointerIdsRef = useRef<Set<number>>(new Set());
  const isUnavailable = isDisabled || keyCode === null;

  const emitKey = (type: "keydown" | "keyup", code: string) => {
    window.dispatchEvent(new KeyboardEvent(type, { code, bubbles: true, cancelable: true }));
  };

  // Releases the key (once) no matter how many pointers were holding it.
  const releaseAll = () => {
    const activePointerIds = activePointerIdsRef.current;
    if (activePointerIds.size === 0) return;
    activePointerIds.clear();
    if (buttonRef.current) buttonRef.current.dataset.pressed = "false";
    if (keyCode !== null) emitKey("keyup", keyCode);
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    // Stops the browser from starting a text selection (or moving focus) when a button is
    // pressed twice in a row: that would interrupt the game.
    event.preventDefault();
    if (isUnavailable || keyCode === null) return;
    if (event.pointerType === "mouse" && event.button !== 0) return;
    try {
      // Keeps the pointer on this button, so releasing outside it still ends the press.
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // The pointer may be gone already; the press still works without capture.
    }
    const activePointerIds = activePointerIdsRef.current;
    const wasHeld = activePointerIds.size > 0;
    activePointerIds.add(event.pointerId);
    if (wasHeld) return;
    event.currentTarget.dataset.pressed = "true";
    emitKey("keydown", keyCode);
  };

  const handlePointerEnd = (event: React.PointerEvent<HTMLButtonElement>) => {
    const activePointerIds = activePointerIdsRef.current;
    if (!activePointerIds.delete(event.pointerId)) return;
    if (activePointerIds.size > 0 || keyCode === null) return;
    event.currentTarget.dataset.pressed = "false";
    emitKey("keyup", keyCode);
  };

  // Safari ignores preventDefault on pointerdown for text selection: a double tap or a long
  // press still selects the nearest word and shows the magnifier. Cancelling touchstart stops
  // it. It must be a native non-passive listener: React registers touchstart as passive.
  useEffect(() => {
    const button = buttonRef.current;
    if (!button) return;
    const cancelTouchDefault = (event: TouchEvent) => event.preventDefault();
    button.addEventListener("touchstart", cancelTouchDefault, { passive: false });
    return () => button.removeEventListener("touchstart", cancelTouchDefault);
  }, []);

  // The release rules that pointer events do not cover: pause or game over while holding,
  // the window losing focus, and leaving the page.
  useEffect(() => {
    const activePointerIds = activePointerIdsRef.current;
    const button = buttonRef.current;
    if (isUnavailable) releaseAll();
    window.addEventListener("blur", releaseAll);
    return () => {
      window.removeEventListener("blur", releaseAll);
      if (activePointerIds.size > 0) {
        activePointerIds.clear();
        if (button) button.dataset.pressed = "false";
        if (keyCode !== null) emitKey("keyup", keyCode);
      }
    };
    // releaseAll only reads refs and keyCode, which are listed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isUnavailable, keyCode]);

  return (
    <button
      ref={buttonRef}
      type="button"
      className={className}
      aria-label={ariaLabel}
      disabled={isUnavailable}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerEnd}
      onPointerCancel={handlePointerEnd}
      // A long press must not open the browser's context menu in the middle of a game.
      onContextMenu={(event) => event.preventDefault()}
      // A double click/tap selects the nearest word; cancel it.
      onDoubleClick={(event) => event.preventDefault()}      onLostPointerCapture={handlePointerEnd}
    >
      {children}
    </button>
  );
}

// On-screen gamepad: four arrows on the left, one action button on the right.
// Controls the game does not use (mapped to null) are rendered disabled.
export function TouchGamepad({ controls, isDisabled }: TouchGamepadProps) {
  return (
    <div className="touch-gamepad">
      <div className="touch-dpad" role="group" aria-label="Cruceta">
        {DIRECTIONS.map(({ name, rotationDegrees, label }) => (
          <TouchKeyButton
            key={name}
            keyCode={controls[name]}
            isDisabled={isDisabled}
            className={`touch-btn touch-${name}`}
            ariaLabel={label}
          >
            <ArrowIcon rotationDegrees={rotationDegrees} />
          </TouchKeyButton>
        ))}
      </div>
      <div className="touch-action">
        <TouchKeyButton
          keyCode={controls.action?.keyCode ?? null}
          isDisabled={isDisabled}
          className="touch-btn touch-fire"
          // No visible text: a generic action button; the label is only for screen readers.
          ariaLabel={controls.action?.label}
        />
      </div>
    </div>
  );
}
