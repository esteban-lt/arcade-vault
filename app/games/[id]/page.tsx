import Link from "next/link";
import { notFound } from "next/navigation";
import { findGameById, GAMES } from "@/lib/games";
import { generateSeededScores } from "@/lib/scores";

const LEADERBOARD_SIZE = 10;
const TOP_THREE_ROW_CLASS_NAMES = ["top1", "top2", "top3"];

export function generateStaticParams() {
  return GAMES.map((game) => ({ id: game.id }));
}

export default async function GameDetailPage(props: PageProps<"/games/[id]">) {
  const { id } = await props.params;
  const game = findGameById(id);
  if (!game) notFound();

  const leaderboard = generateSeededScores(id.length * 17 + 3, LEADERBOARD_SIZE);

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
            <div>
              <div className="l">Partidas</div>
              <div className="v">{game.playsLabel}</div>
            </div>
            <div>
              <div className="l">Mejor global</div>
              <div className="v" style={{ color: "var(--magenta)", textShadow: "0 0 6px rgba(255,0,110,0.5)" }}>
                {game.bestScore.toLocaleString("es-ES")}
              </div>
            </div>
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
            <Link href="/" className="btn ghost lg">
              VOLVER AL VAULT
            </Link>
          </div>
        </div>
      </div>

      <aside>
        <div className="leaderboard">
          <h3>MEJORES PUNTUACIONES</h3>
          {leaderboard.map((entry, index) => (
            <div key={entry.playerName} className={"lb-row" + (TOP_THREE_ROW_CLASS_NAMES[index] ? " " + TOP_THREE_ROW_CLASS_NAMES[index] : "")}>
              <div className="rk">#{String(entry.rank).padStart(2, "0")}</div>
              <div className="pl">
                {entry.playerName}
                <div style={{ fontSize: 10, color: "var(--ink-faint)", letterSpacing: "0.1em" }}>{entry.date}</div>
              </div>
              <div className="sc">{entry.score.toLocaleString("es-ES")}</div>
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}
