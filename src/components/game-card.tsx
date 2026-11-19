"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Suspense, use, useRef, type KeyboardEvent, type MouseEvent } from "react";
import type { Game, GameAccentColor } from "@/lib/games";
import { findGameStats, formatBestScore, type GameStats } from "@/lib/leaderboard-format";

type GameStatsPromise = Promise<Record<string, GameStats>>;

const PLAY_BUTTON_VARIANT_BY_ACCENT: Record<GameAccentColor, string> = {
  cyan: "",
  green: "",
  magenta: " magenta",
  yellow: " yellow",
};

const TILT_LIFT_PIXELS = 6;
const TILT_X_DEGREES = 6;
const TILT_Y_DEGREES = 8;

function BestScoreValue({ gameId, gameStatsPromise }: { gameId: string; gameStatsPromise: GameStatsPromise }) {
  const stats = findGameStats(use(gameStatsPromise), gameId);
  return <b>{formatBestScore(stats.bestScore)}</b>;
}

export function GameCard({ game, gameStatsPromise }: { game: Game; gameStatsPromise: GameStatsPromise }) {
  const router = useRouter();
  const cardRef = useRef<HTMLDivElement>(null);
  const detailPath = `/games/${game.id}`;

  const handleMouseMove = (event: MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;
    const bounds = card.getBoundingClientRect();
    const horizontalOffset = (event.clientX - bounds.left) / bounds.width - 0.5;
    const verticalOffset = (event.clientY - bounds.top) / bounds.height - 0.5;
    card.style.transform =
      `translateY(-${TILT_LIFT_PIXELS}px) ` +
      `rotateX(${-verticalOffset * TILT_X_DEGREES}deg) ` +
      `rotateY(${horizontalOffset * TILT_Y_DEGREES}deg)`;
  };

  const handleMouseLeave = () => {
    const card = cardRef.current;
    if (card) card.style.transform = "";
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget && event.key === "Enter") {
      router.push(detailPath);
    }
  };

  return (
    <div
      ref={cardRef}
      className="card"
      role="link"
      tabIndex={0}
      aria-label={game.title}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={() => router.push(detailPath)}
      onKeyDown={handleKeyDown}
    >
      <div className="cover">
        <div className={"cover-bg " + game.coverClassName}></div>
        <div className="label">{game.category}</div>
      </div>
      <div className="meta">
        <div className="title">{game.title}</div>
        <div className="desc">{game.shortDescription}</div>
        <div className="row">
          <div className="score-badge">
            <span>MEJOR PUNTUACIÓN</span>
            <Suspense fallback={<b>···</b>}>
              <BestScoreValue gameId={game.id} gameStatsPromise={gameStatsPromise} />
            </Suspense>
          </div>
          <Link
            href={detailPath}
            className={"btn" + PLAY_BUTTON_VARIANT_BY_ACCENT[game.accentColor]}
            onClick={(event) => event.stopPropagation()}
          >
            JUGAR
          </Link>
        </div>
      </div>
    </div>
  );
}
