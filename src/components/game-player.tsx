"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { GameCanvas, type GameCanvasHandle } from "@/components/game-canvas";
import { findGameEngineFactory } from "@/lib/games/engine-registry";
import type { GameSnapshot } from "@/lib/games/game-engine";
import { saveScore } from "@/lib/score-storage";

const GUEST_PLAYER_NAME = "INVITADO";
const MAXIMUM_PLAYER_NAME_LENGTH = 10;
const PLAYER_LIVES = 3;
const SCORE_TICK_MILLISECONDS = 220;
const MINIMUM_POINTS_PER_TICK = 10;
const POINTS_RANGE_PER_TICK = 90;
const POINTS_PER_LEVEL = 2500;

type GamePlayerProps = {
  gameId: string;
  gameTitle: string;
};

// Games with a real engine (see engine-registry) run on a canvas and report their state;
// the rest are a visual simulation: the score grows on its own, there is no real game loop.
export function GamePlayer({ gameId, gameTitle }: GamePlayerProps) {
  const { user } = useAuth();
  const createEngine = findGameEngineFactory(gameId);
  const canvasHandleRef = useRef<GameCanvasHandle>(null);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(PLAYER_LIVES);
  const [engineLevel, setEngineLevel] = useState(1);
  const [isPaused, setIsPaused] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [editedPlayerName, setEditedPlayerName] = useState<string | null>(null);
  const [isScoreSaved, setIsScoreSaved] = useState(false);

  // The session loads after hydration, so the name is derived instead of copied into state.
  const playerName = editedPlayerName ?? user?.name ?? GUEST_PLAYER_NAME;
  const level = createEngine ? engineLevel : 1 + Math.floor(score / POINTS_PER_LEVEL);

  useEffect(() => {
    if (createEngine || isGameOver || isPaused) return;
    const intervalId = setInterval(() => {
      const points = MINIMUM_POINTS_PER_TICK + Math.floor(Math.random() * POINTS_RANGE_PER_TICK);
      setScore((currentScore) => currentScore + points);
    }, SCORE_TICK_MILLISECONDS);
    return () => clearInterval(intervalId);
  }, [createEngine, isGameOver, isPaused]);

  // Next keeps a page that was navigated away from alive but hidden, which destroys the
  // engine and recreates it (fresh game) on return. Reset the UI state when hiding so the
  // HUD, pause and game-over modal match that fresh game instead of the abandoned one.
  useEffect(() => {
    if (!createEngine) return;
    return () => {
      setScore(0);
      setLives(PLAYER_LIVES);
      setEngineLevel(1);
      setIsPaused(false);
      setIsGameOver(false);
      setIsScoreSaved(false);
    };
  }, [createEngine]);

  // P and Esc toggle the pause of a real engine; the player owns the pause state.
  useEffect(() => {
    if (!createEngine || isGameOver) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.repeat || (event.code !== "KeyP" && event.code !== "Escape")) return;
      const target = event.target;
      if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) return;
      setIsPaused((paused) => !paused);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [createEngine, isGameOver]);

  const handleSnapshotChange = (snapshot: GameSnapshot) => {
    setScore(snapshot.score);
    setLives(snapshot.lives);
    setEngineLevel(snapshot.level);
  };

  const handleEngineGameOver = (finalScore: number) => {
    setScore(finalScore);
    setIsPaused(false);
    setIsGameOver(true);
  };

  const endGame = () => {
    if (createEngine) canvasHandleRef.current?.endGame();
    else setIsGameOver(true);
  };

  const restart = () => {
    setScore(0);
    setLives(PLAYER_LIVES);
    setEngineLevel(1);
    setIsPaused(false);
    setIsGameOver(false);
    setIsScoreSaved(false);
    canvasHandleRef.current?.restart();
  };

  const handleSaveScore = () => {
    saveScore({ gameId, playerName, score });
    setIsScoreSaved(true);
  };

  return (
    <div className="av-player fade-in">
      <div className="player-hud">
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
          <div className="hud-stat">
            <div className="l">Jugador</div>
            <div className="v" style={{ color: "var(--ink)" }}>{playerName}</div>
          </div>
          <div className="hud-stat">
            <div className="l">Puntuación</div>
            <div className="v">{score.toLocaleString("es-ES")}</div>
          </div>
          <div className="hud-stat lives">
            <div className="l">Vidas</div>
            <div className="v">{lives > 0 ? Array(lives).fill("♥").join(" ") : "—"}</div>
          </div>
          <div className="hud-stat level">
            <div className="l">Nivel</div>
            <div className="v">{String(level).padStart(2, "0")}</div>
          </div>
        </div>
        <div className="hud-actions">
          <button type="button" className="btn yellow" onClick={() => setIsPaused((paused) => !paused)}>
            {isPaused ? "REANUDAR" : "PAUSA"}
          </button>
          <button type="button" className="btn magenta" onClick={endGame}>
            FIN
          </button>
          <Link href={`/games/${gameId}`} className="btn ghost">
            SALIR
          </Link>
        </div>
      </div>

      <div className="crt">
        <div className="crt-screen">
          {createEngine ? (
            <GameCanvas
              createEngine={createEngine}
              isPaused={isPaused}
              handleRef={canvasHandleRef}
              label={`Pantalla de juego de ${gameTitle}`}
              onSnapshotChange={handleSnapshotChange}
              onGameOver={handleEngineGameOver}
            />
          ) : (
            <div className="game-arena">
              <div className="grid-floor"></div>
              <div className="enemy e1"></div>
              <div className="enemy e2"></div>
              <div className="enemy e3"></div>
              <div className="player-ship"></div>
            </div>
          )}
          {isPaused && (
            <div className="crt-content" style={{ background: "rgba(0,0,0,0.6)", zIndex: 5 }}>
              <div>
                <div className="pixel neon-yellow" style={{ fontSize: 22 }}>EN PAUSA</div>
                <div
                  className="mono"
                  style={{ fontSize: 11, color: "var(--ink-dim)", marginTop: 10, letterSpacing: "0.16em" }}
                >
                  PULSA REANUDAR PARA CONTINUAR
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="crt-bottom">
          <span className="led">SEÑAL OK</span>
          <span>{gameTitle} · CRT-83 · 60 HZ</span>
          <span>CARGA · 1MB</span>
        </div>
      </div>

      {isGameOver && (
        <div className="modal-bd">
          <div className="modal" role="dialog" aria-modal="true" aria-label="Fin del juego">
            <h2>FIN DEL JUEGO</h2>
            <div className="final-label">PUNTUACIÓN FINAL</div>
            <div className="final">{score.toLocaleString("es-ES")}</div>
            {isScoreSaved ? (
              <div className="toast-saved">▸ PUNTUACIÓN GUARDADA_</div>
            ) : (
              <div className="input-row">
                <input
                  value={playerName}
                  onChange={(event) =>
                    setEditedPlayerName(event.target.value.toUpperCase().slice(0, MAXIMUM_PLAYER_NAME_LENGTH))
                  }
                  placeholder="TUS INICIALES"
                  aria-label="Tus iniciales"
                />
                <button type="button" className="btn yellow" onClick={handleSaveScore}>
                  GUARDAR PUNTUACIÓN
                </button>
              </div>
            )}
            <div className="actions">
              <button type="button" className="btn" onClick={restart}>
                JUGAR DE NUEVO
              </button>
              <Link href="/games" className="btn magenta">
                VOLVER AL VAULT
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
