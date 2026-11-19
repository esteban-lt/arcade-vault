import Link from "next/link";
import { GAMES, type Game } from "@/lib/games";
import {
  formatScore,
  formatScoreDate,
  HALL_OF_FAME_TABLE_SIZE,
  type LeaderboardEntry,
} from "@/lib/leaderboard-format";

const TOP_THREE_ROW_CLASS_NAMES = ["top1", "top2", "top3"];
const NEON_YELLOW_TEXT_SHADOW = "0 0 6px rgba(245,255,0,0.5)";
const EMPTY_RANKING_MESSAGE = "AÚN NO HAY PUNTUACIONES";

function formatRank(rank: number): string {
  return String(rank).padStart(2, "0");
}

function PodiumSlot({
  entry,
  rank,
  className,
  isChampion = false,
}: {
  entry: LeaderboardEntry | undefined;
  rank: number;
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
        {formatRank(rank)}
      </div>
      <div className="name">{entry ? entry.playerName : "—"}</div>
      <div className="score" style={isChampion ? { fontSize: 20 } : undefined}>
        {entry ? formatScore(entry.score) : "—"}
      </div>
      <div className="date">{entry ? formatScoreDate(entry.achievedAt) : "LIBRE"}</div>
    </div>
  );
}

export function HallOfFameHeader() {
  return (
    <div className="hall-head">
      <h1>SALÓN DE LA FAMA</h1>
      <p className="pixel" style={{ fontSize: 10 }}>
        LOS NOMBRES QUE NUNCA SE BORRAN DE LA PANTALLA
      </p>
    </div>
  );
}

export function HallOfFameTabs({ selectedGameId }: { selectedGameId: string | null }) {
  return (
    <div className="hall-tabs">
      {GAMES.map((game) => (
        <Link
          key={game.id}
          href={`/hall-of-fame?game=${game.id}`}
          scroll={false}
          className={"chip" + (selectedGameId === game.id ? " active" : "")}
          aria-current={selectedGameId === game.id ? "page" : undefined}
        >
          {game.title}
        </Link>
      ))}
    </div>
  );
}

export function HallOfFameLoading() {
  return (
    <>
      <HallOfFameTabs selectedGameId={null} />
      <div className="hall-table">
        <div className="leaderboard-empty">CARGANDO RANKING…</div>
      </div>
    </>
  );
}

type HallOfFameProps = {
  selectedGame: Game;
  ranking: LeaderboardEntry[];
  // undefined: no session (the row is hidden); null: signed in without a score in this game.
  playerBest: LeaderboardEntry | null | undefined;
};

export function HallOfFame({ selectedGame, ranking, playerBest }: HallOfFameProps) {
  const [champion, runnerUp, thirdPlace] = ranking;
  const isRankingEmpty = ranking.length === 0;

  return (
    <>
      <HallOfFameTabs selectedGameId={selectedGame.id} />

      {isRankingEmpty ? (
        <div className="hall-table" style={{ marginBottom: 24 }}>
          <div className="leaderboard-empty">{EMPTY_RANKING_MESSAGE}</div>
        </div>
      ) : (
        <div className="podium">
          <PodiumSlot entry={runnerUp} rank={2} className="silver" />
          <PodiumSlot entry={champion} rank={1} className="gold" isChampion />
          <PodiumSlot entry={thirdPlace} rank={3} className="bronze" />
        </div>
      )}

      <div className="hall-table">
        <div className="th">
          <div>RANGO</div>
          <div>JUGADOR</div>
          <div>PUNTUACIÓN</div>
          <div>FECHA</div>
        </div>
        {isRankingEmpty && <div className="leaderboard-empty">{EMPTY_RANKING_MESSAGE}</div>}
        {ranking.map((entry, index) => (
          <div
            key={entry.userId}
            className={"tr" + (TOP_THREE_ROW_CLASS_NAMES[index] ? " " + TOP_THREE_ROW_CLASS_NAMES[index] : "")}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="rk">#{formatRank(entry.rank)}</div>
            <div className="pl">{entry.playerName}</div>
            <div className="sc">{formatScore(entry.score)}</div>
            <div className="dt">{formatScoreDate(entry.achievedAt)}</div>
          </div>
        ))}
        {playerBest !== undefined && (
          <>
            <div className="tr you-label">▸ TU MEJOR MARCA EN {selectedGame.title}</div>
            {playerBest ? (
              <div className="tr you" style={{ animationDelay: `${HALL_OF_FAME_TABLE_SIZE * 50 + 50}ms` }}>
                <div className="rk" style={{ color: "var(--yellow)" }}>#{formatRank(playerBest.rank)}</div>
                <div className="pl" style={{ color: "var(--yellow)" }}>{playerBest.playerName}</div>
                <div className="sc" style={{ color: "var(--yellow)", textShadow: NEON_YELLOW_TEXT_SHADOW }}>
                  {formatScore(playerBest.score)}
                </div>
                <div className="dt">{formatScoreDate(playerBest.achievedAt)}</div>
              </div>
            ) : (
              <div className="tr you" style={{ animationDelay: `${HALL_OF_FAME_TABLE_SIZE * 50 + 50}ms` }}>
                <div className="rk" style={{ color: "var(--yellow)" }}>—</div>
                <div className="pl" style={{ color: "var(--yellow)" }}>SIN MARCA</div>
                <div className="sc">
                  <Link href={`/games/${selectedGame.id}/play`} style={{ color: "var(--cyan)" }}>
                    ¡JUEGA Y ENTRA AL RANKING!
                  </Link>
                </div>
                <div className="dt"></div>
              </div>
            )}
          </>
        )}
      </div>

      <div style={{ textAlign: "center", marginTop: 32 }}>
        <Link href="/games" className="btn lg">
          VOLVER A LA BIBLIOTECA
        </Link>
      </div>
    </>
  );
}
