"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { GAMES } from "@/lib/games";
import { generateSeededScores, type ScoreEntry } from "@/lib/scores";

const TABLE_SIZE = 12;
const TOP_THREE_ROW_CLASS_NAMES = ["top1", "top2", "top3"];
const USER_BEST_SCORE_DATE = "11/05/2026";
const FALLBACK_USER_BEST_SCORE = 9999;

const NEON_YELLOW_TEXT_SHADOW = "0 0 6px rgba(245,255,0,0.5)";

function formatScore(score: number): string {
  return score.toLocaleString("es-ES");
}

function PodiumSlot({
  entry,
  className,
  isChampion = false,
}: {
  entry: ScoreEntry;
  className: string;
  isChampion?: boolean;
}) {
  return (
    <div className={"podium-slot " + className}>
      {isChampion && (
        <div className="pixel" style={{ fontSize: 9, color: "var(--gold)", letterSpacing: "0.18em" }}>
          CAMPEÓN
        </div>
      )}
      <div className="rank-num" style={isChampion ? { fontSize: 36, marginTop: 4 } : undefined}>
        {String(entry.rank).padStart(2, "0")}
      </div>
      <div className="name">{entry.playerName}</div>
      <div className="score" style={isChampion ? { fontSize: 20 } : undefined}>
        {formatScore(entry.score)}
      </div>
      <div className="date">{entry.date}</div>
    </div>
  );
}

export function HallOfFame() {
  const { user } = useAuth();
  const [selectedGameId, setSelectedGameId] = useState(GAMES[0].id);

  const selectedGame = GAMES.find((game) => game.id === selectedGameId) ?? GAMES[0];
  const ranking = generateSeededScores(selectedGameId.length * 23 + 7, TABLE_SIZE);
  const [champion, runnerUp, thirdPlace] = ranking;

  // Simulated personal best, derived from the ranking so it changes with the selected game.
  const userRank = 8 + (selectedGameId.length % 4);
  const userScore = ranking[5].score - 2400 || FALLBACK_USER_BEST_SCORE;

  return (
    <div className="av-hall fade-in">
      <div className="hall-head">
        <h1>SALÓN DE LA FAMA</h1>
        <p className="pixel" style={{ fontSize: 10 }}>
          LOS NOMBRES QUE NUNCA SE BORRAN DE LA PANTALLA
        </p>
      </div>

      <div className="hall-tabs">
        {GAMES.map((game) => (
          <button
            key={game.id}
            type="button"
            className={"chip" + (selectedGameId === game.id ? " active" : "")}
            onClick={() => setSelectedGameId(game.id)}
          >
            {game.title}
          </button>
        ))}
      </div>

      <div className="podium">
        <PodiumSlot entry={runnerUp} className="silver" />
        <PodiumSlot entry={champion} className="gold" isChampion />
        <PodiumSlot entry={thirdPlace} className="bronze" />
      </div>

      <div className="hall-table">
        <div className="th">
          <div>RANGO</div>
          <div>JUGADOR</div>
          <div>PUNTUACIÓN</div>
          <div>FECHA</div>
        </div>
        {ranking.map((entry, index) => (
          <div
            key={entry.playerName + index}
            className={"tr" + (TOP_THREE_ROW_CLASS_NAMES[index] ? " " + TOP_THREE_ROW_CLASS_NAMES[index] : "")}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="rk">#{String(entry.rank).padStart(2, "0")}</div>
            <div className="pl">{entry.playerName}</div>
            <div className="sc">{formatScore(entry.score)}</div>
            <div className="dt">{entry.date}</div>
          </div>
        ))}
        {user && (
          <>
            <div className="tr you-label">▸ TU MEJOR MARCA EN {selectedGame.title}</div>
            <div className="tr you" style={{ animationDelay: `${ranking.length * 50 + 50}ms` }}>
              <div className="rk" style={{ color: "var(--yellow)" }}>
                #{String(userRank).padStart(2, "0")}
              </div>
              <div className="pl" style={{ color: "var(--yellow)" }}>{user.name}</div>
              <div className="sc" style={{ color: "var(--yellow)", textShadow: NEON_YELLOW_TEXT_SHADOW }}>
                {formatScore(userScore)}
              </div>
              <div className="dt">{USER_BEST_SCORE_DATE}</div>
            </div>
          </>
        )}
      </div>

      <div style={{ textAlign: "center", marginTop: 32 }}>
        <Link href="/" className="btn lg">
          VOLVER A LA BIBLIOTECA
        </Link>
      </div>
    </div>
  );
}
