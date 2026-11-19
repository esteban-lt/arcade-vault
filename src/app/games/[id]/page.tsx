import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { findGameById, GAMES } from "@/lib/games";
import {
  findGameStats,
  formatBestScore,
  formatScore,
  formatScoreCount,
  formatScoreDate,
  GAME_DETAIL_LEADERBOARD_SIZE,
  getAllGameStats,
  getGameLeaderboard,
} from "@/lib/leaderboard";

const TOP_THREE_ROW_CLASS_NAMES = ["top1", "top2", "top3"];
const LOADING_VALUE = "···";

export function generateStaticParams() {
  return GAMES.map((game) => ({ id: game.id }));
}

function GameStatValues({ playsValue, bestScoreValue }: { playsValue: string; bestScoreValue: string }) {
  return (
    <>
      <div>
        <div className="l">Partidas</div>
        <div className="v">{playsValue}</div>
      </div>
      <div>
        <div className="l">Mejor global</div>
        <div className="v" style={{ color: "var(--magenta)", textShadow: "0 0 6px rgba(255,0,110,0.5)" }}>
          {bestScoreValue}
        </div>
      </div>
    </>
  );
}

// Read on every request: the stats change whenever someone saves a score.
async function GameStats({ gameId }: { gameId: string }) {
  const stats = findGameStats(await getAllGameStats(), gameId);
  return (
    <GameStatValues
      playsValue={formatScoreCount(stats.scoreCount)}
      bestScoreValue={formatBestScore(stats.bestScore)}
    />
  );
}

async function GameLeaderboardRows({ gameId }: { gameId: string }) {
  const leaderboard = await getGameLeaderboard(gameId, GAME_DETAIL_LEADERBOARD_SIZE);
  if (leaderboard.length === 0) {
    return <div className="leaderboard-empty">AÚN NO HAY PUNTUACIONES</div>;
  }

  return leaderboard.map((entry, index) => (
    <div key={entry.userId} className={"lb-row" + (TOP_THREE_ROW_CLASS_NAMES[index] ? " " + TOP_THREE_ROW_CLASS_NAMES[index] : "")}>
      <div className="rk">#{String(entry.rank).padStart(2, "0")}</div>
      <div className="pl">
        {entry.playerName}
        <div style={{ fontSize: 10, color: "var(--ink-faint)", letterSpacing: "0.1em" }}>
          {formatScoreDate(entry.achievedAt)}
        </div>
      </div>
      <div className="sc">{formatScore(entry.score)}</div>
    </div>
  ));
}

function GameLeaderboardSkeleton() {
  return Array.from({ length: GAME_DETAIL_LEADERBOARD_SIZE }, (_, index) => (
    <div key={index} className="lb-row is-loading" aria-hidden="true">
      <div className="rk">#{String(index + 1).padStart(2, "0")}</div>
      <div className="pl">{LOADING_VALUE}</div>
      <div className="sc">{LOADING_VALUE}</div>
    </div>
  ));
}

export default async function GameDetailPage(props: PageProps<"/games/[id]">) {
  const { id } = await props.params;
  const game = findGameById(id);
  if (!game) notFound();

  return (
    <div className="av-detail fade-in">
      <div>
        <div className="detail-cover">
          <div className={"cover-bg " + game.coverClassName}></div>
        </div>
        <div style={{ marginTop: 20 }} className="detail-info">
          <div className="detail-tags">
            <span>{game.category}</span>
            <span>1 JUGADOR</span>
            <span>TECLADO / TÁCTIL</span>
            <span>RETRO 1985</span>
          </div>
          <h2 className="neon-cyan">{game.title}</h2>
          <p>{game.longDescription}</p>
          <div className="stat-strip">
            <Suspense fallback={<GameStatValues playsValue={LOADING_VALUE} bestScoreValue={LOADING_VALUE} />}>
              <GameStats gameId={game.id} />
            </Suspense>
            <div>
              <div className="l">Dificultad</div>
              <div className="v" style={{ color: "var(--yellow)", textShadow: "0 0 6px rgba(245,255,0,0.5)" }}>
                ★ ★ ★ ☆ ☆
              </div>
            </div>
          </div>
          <div className="detail-actions">
            <Link href={`/games/${game.id}/play`} className="btn xl pulse">
              ▶&nbsp; JUGAR AHORA
            </Link>
            <Link href="/games" className="btn ghost lg">
              VOLVER AL VAULT
            </Link>
          </div>
        </div>
      </div>

      <aside>
        <div className="leaderboard">
          <h3>MEJORES PUNTUACIONES</h3>
          <Suspense fallback={<GameLeaderboardSkeleton />}>
            <GameLeaderboardRows gameId={game.id} />
          </Suspense>
        </div>
      </aside>
    </div>
  );
}
