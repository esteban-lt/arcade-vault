"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { GameCanvas, type GameCanvasHandle } from "@/components/game-canvas";
import { findGameEngineFactory } from "@/lib/games/engine-registry";
import type { GameSnapshot } from "@/lib/games/game-engine";
import { isSkinId, SKIN_IDS, SKIN_LABELS } from "@/lib/games/shared/skins";
import { hasGlobalSkins } from "@/lib/games/skin-registry";
import { useStoredSkin } from "@/lib/use-stored-skin";
import { isValidScore } from "@/lib/leaderboard-format";
import { saveScoreAction } from "@/app/games/[id]/play/actions";

const GUEST_PLAYER_NAME = "INVITADO";
const PLAYER_LIVES = 3;
const SCORE_TICK_MILLISECONDS = 220;
const MINIMUM_POINTS_PER_TICK = 10;
const POINTS_RANGE_PER_TICK = 90;
const POINTS_PER_LEVEL = 2500;

// "unauthenticated" happens when the session expired between playing and saving.
type SaveStatus = "idle" | "saving" | "saved" | "unauthenticated" | "invalid" | "error";

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
  // Games in the skin registry take their skin from here; the rest handle it themselves.
  const usesGlobalSkins = hasGlobalSkins(gameId);
  const { skinId, setSkinId, isReady: isSkinReady } = useStoredSkin(gameId);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(PLAYER_LIVES);
  const [engineLevel, setEngineLevel] = useState(1);
  const [isPaused, setIsPaused] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");

  // The session loads after hydration, so the name is derived instead of copied into state.
  const playerName = user?.name ?? GUEST_PLAYER_NAME;
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
      setSaveStatus("idle");
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
    setSaveStatus("idle");
    canvasHandleRef.current?.restart();
  };

  const handleSaveScore = async () => {
    setSaveStatus("saving");
    try {
      const result = await saveScoreAction(gameId, score);
      setSaveStatus(result.status);
    } catch {
      // Network failure or server crash: the action never answered.
      setSaveStatus("error");
    }
  };

  const renderSaveArea = () => {
    if (!createEngine) {
      return <div className="save-notice">PARTIDA DE DEMOSTRACIÓN: NO SE GUARDA</div>;
    }
    if (!isValidScore(score)) return null;
    if (!user || saveStatus === "unauthenticated") {
      return (
        <div className="save-notice">
          <Link href="/auth">INICIA SESIÓN PARA GUARDAR TU PUNTUACIÓN</Link>
        </div>
      );
    }
    if (saveStatus === "saved") return <div className="toast-saved">▸ PUNTUACIÓN GUARDADA_</div>;
    if (saveStatus === "invalid") {
      return (
        <div className="form-error save-feedback" role="alert">
          ESTA PUNTUACIÓN NO SE PUEDE GUARDAR.
        </div>
      );
    }

    const isSaving = saveStatus === "saving";
    return (
      <div className="save-row">
        {saveStatus === "error" && (
          <div className="form-error save-feedback" role="alert">
            NO SE PUDO GUARDAR LA PUNTUACIÓN. REVISA TU CONEXIÓN E INTÉNTALO DE NUEVO.
          </div>
        )}
        <button type="button" className="btn yellow" onClick={handleSaveScore} disabled={isSaving}>
          {isSaving ? "GUARDANDO…" : saveStatus === "error" ? "REINTENTAR" : "GUARDAR PUNTUACIÓN"}
        </button>
      </div>
    );
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
          {createEngine && usesGlobalSkins && (
            <select
              className="skin-select"
              aria-label="Skin"
              value={skinId}
              onChange={(event) => {
                if (isSkinId(event.target.value)) setSkinId(event.target.value);
                // Give the keyboard back to the game: arrow keys must not keep acting on the <select>.
                event.target.blur();
              }}
            >
              {SKIN_IDS.map((optionSkinId) => (
                <option key={optionSkinId} value={optionSkinId}>
                  {SKIN_LABELS[optionSkinId]}
                </option>
              ))}
            </select>
          )}
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
            // With global skins the canvas waits for the saved skin, so the first frame uses it.
            (!usesGlobalSkins || isSkinReady) && (
              <GameCanvas
                createEngine={createEngine}
                isPaused={isPaused}
                skinId={usesGlobalSkins ? skinId : undefined}
                handleRef={canvasHandleRef}
                label={`Pantalla de juego de ${gameTitle}`}
                onSnapshotChange={handleSnapshotChange}
                onGameOver={handleEngineGameOver}
              />
            )
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
            {renderSaveArea()}
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
