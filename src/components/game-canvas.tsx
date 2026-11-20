"use client";

import { useEffect, useImperativeHandle, useRef, type Ref } from "react";
import { CANVAS_HEIGHT, CANVAS_WIDTH } from "@/lib/games/shared/canvas";
import type { GameEngine, GameEngineCallbacks, GameEngineFactory } from "@/lib/games/game-engine";

export type GameCanvasHandle = {
  restart: () => void;
  endGame: () => void;
};

type GameCanvasProps = GameEngineCallbacks & {
  createEngine: GameEngineFactory;
  isPaused: boolean;
  handleRef: Ref<GameCanvasHandle>;
  label: string;
};

// Hosts a game engine: creates it after mount and destroys it on unmount.
export function GameCanvas({
  createEngine,
  isPaused,
  handleRef,
  label,
  onSnapshotChange,
  onGameOver,
}: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  // Always points at the latest callbacks, so the engine is not recreated when they change.
  const callbacksRef = useRef<GameEngineCallbacks>({ onSnapshotChange, onGameOver });

  useEffect(() => {
    callbacksRef.current = { onSnapshotChange, onGameOver };
  }, [onSnapshotChange, onGameOver]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const engine = createEngine(canvas, {
      onSnapshotChange: (snapshot) => callbacksRef.current.onSnapshotChange(snapshot),
      onGameOver: (finalScore) => callbacksRef.current.onGameOver(finalScore),
    });
    engineRef.current = engine;
    engine.start();
    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, [createEngine]);

  useEffect(() => {
    engineRef.current?.setPaused(isPaused);
  }, [isPaused]);

  useImperativeHandle(
    handleRef,
    () => ({
      restart: () => engineRef.current?.restart(),
      endGame: () => engineRef.current?.endGame(),
    }),
    [],
  );

  return (
    <canvas
      ref={canvasRef}
      className="game-canvas"
      width={CANVAS_WIDTH}
      height={CANVAS_HEIGHT}
      role="img"
      aria-label={label}
    />
  );
}
