// Contract shared by every real (non-simulated) game engine.

import type { SkinId } from "./shared/skins";

export type GameSnapshot = {
  score: number;
  lives: number;
  level: number;
};

export type GameEngineCallbacks = {
  // Called only when score, lives or level change, never once per frame.
  onSnapshotChange: (snapshot: GameSnapshot) => void;
  // Called once when the last life is lost or when endGame() is invoked.
  onGameOver: (finalScore: number) => void;
};

export type GameEngine = {
  start: () => void;
  setPaused: (isPaused: boolean) => void;
  restart: () => void;
  endGame: () => void;
  // Cancels the animation frame and removes every listener.
  destroy: () => void;
  // Optional: engines without it handle their own skin. Changing the skin only affects
  // drawing, never score, lives, level or game logic.
  setSkin?: (skinId: SkinId) => void;
};

export type GameEngineFactory = (
  canvas: HTMLCanvasElement,
  callbacks: GameEngineCallbacks,
) => GameEngine;
