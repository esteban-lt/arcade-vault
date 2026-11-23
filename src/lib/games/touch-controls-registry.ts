export type TouchActionButton = {
  keyCode: string;
  label: string;
};

// Each control holds the KeyboardEvent.code it sends; a control mapped to null is rendered disabled.
export type TouchControlsConfig = {
  up: string | null;
  down: string | null;
  left: string | null;
  right: string | null;
  action: TouchActionButton | null;
};

// Games that show the on-screen gamepad on touch devices. The rest have no gamepad.
const TOUCH_CONTROLS_BY_GAME_ID: ReadonlyMap<string, TouchControlsConfig> = new Map([
  [
    "asteroids",
    {
      up: "ArrowUp", // thrust
      down: null,
      left: "ArrowLeft", // rotate
      right: "ArrowRight",
      action: { keyCode: "Space", label: "DISPARO" },
    },
  ],
  [
    "block-stack",
    {
      up: "ArrowUp", // rotate
      down: "ArrowDown", // soft drop
      left: "ArrowLeft",
      right: "ArrowRight",
      action: { keyCode: "Space", label: "CAÍDA RÁPIDA" }, // hard drop
    },
  ],
  [
    "wall-breaker",
    {
      up: null,
      down: null,
      left: "ArrowLeft",
      right: "ArrowRight",
      action: null,
    },
  ],
  [
    "fruit-snake",
    {
      up: "ArrowUp",
      down: "ArrowDown",
      left: "ArrowLeft",
      right: "ArrowRight",
      action: null,
    },
  ],
]);

// null = the game has no gamepad.
export function findTouchControls(gameId: string): TouchControlsConfig | null {
  return TOUCH_CONTROLS_BY_GAME_ID.get(gameId) ?? null;
}
