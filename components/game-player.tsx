"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
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

// Visual simulation only: the score grows on its own, there is no real game loop.
export function GamePlayer({ gameId, gameTitle }: GamePlayerProps) {
  const { user } = useAuth();
  const [score, setScore] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [editedPlayerName, setEditedPlayerName] = useState<string | null>(null);
  const [isScoreSaved, setIsScoreSaved] = useState(false);

  // The session loads after hydration, so the name is derived instead of copied into state.
  const playerName = editedPlayerName ?? user?.name ?? GUEST_PLAYER_NAME;
  const level = 1 + Math.floor(score / POINTS_PER_LEVEL);

  useEffect(() => {
    if (isGameOver || isPaused) return;
    const intervalId = setInterval(() => {
      const points = MINIMUM_POINTS_PER_TICK + Math.floor(Math.random() * POINTS_RANGE_PER_TICK);
      setScore((currentScore) => currentScore + points);
    }, SCORE_TICK_MILLISECONDS);
    return () => clearInterval(intervalId);
  }, [isGameOver, isPaused]);

  const restart = () => {
    setScore(0);
    setIsPaused(false);
    setIsGameOver(false);
    setIsScoreSaved(false);
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
            <div className="v">{Array(PLAYER_LIVES).fill("♥").join(" ")}</div>
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
          <button type="button" className="btn magenta" onClick={() => setIsGameOver(true)}>
            FIN
          </button>
          <Link href={`/games/${gameId}`} className="btn ghost">
            SALIR
          </Link>
        </div>
      </div>

      <div className="crt">
        <div className="crt-screen">
          <div className="game-arena">
            <div className="grid-floor"></div>
            <div className="enemy e1"></div>
            <div className="enemy e2"></div>
            <div className="enemy e3"></div>
            <div className="player-ship"></div>
          </div>
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
              <Link href="/" className="btn magenta">
                VOLVER AL VAULT
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
