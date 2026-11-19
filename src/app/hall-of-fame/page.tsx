import { Suspense } from "react";
import { HallOfFame, HallOfFameHeader, HallOfFameLoading } from "@/components/hall-of-fame";
import { findGameById, GAMES, type Game } from "@/lib/games";
import {
  findGameStats,
  getAllGameStats,
  getGameLeaderboard,
  getPlayerBest,
  HALL_OF_FAME_TABLE_SIZE,
} from "@/lib/leaderboard";
import { createClient } from "@/lib/supabase/server";

// Missing or unknown ?game=: the first game in catalog order with scores, or the first game.
function resolveSelectedGame(requestedGameId: unknown, scoreCountByGame: (gameId: string) => number): Game {
  const requestedGame = typeof requestedGameId === "string" ? findGameById(requestedGameId) : undefined;
  return requestedGame ?? GAMES.find((game) => scoreCountByGame(game.id) > 0) ?? GAMES[0];
}

async function HallOfFameContent({ searchParams }: { searchParams: PageProps<"/hall-of-fame">["searchParams"] }) {
  const { game: requestedGameId } = await searchParams;
  const gameStats = await getAllGameStats();
  const selectedGame = resolveSelectedGame(
    requestedGameId,
    (gameId) => findGameStats(gameStats, gameId).scoreCount,
  );

  const supabase = await createClient();
  const [ranking, { data: { user } }] = await Promise.all([
    getGameLeaderboard(selectedGame.id, HALL_OF_FAME_TABLE_SIZE),
    supabase.auth.getUser(),
  ]);
  const playerBest = user ? await getPlayerBest(selectedGame.id, user.id) : undefined;

  return <HallOfFame selectedGame={selectedGame} ranking={ranking} playerBest={playerBest} />;
}

export default function HallOfFamePage(props: PageProps<"/hall-of-fame">) {
  return (
    <div className="av-hall fade-in">
      <HallOfFameHeader />
      <Suspense fallback={<HallOfFameLoading />}>
        <HallOfFameContent searchParams={props.searchParams} />
      </Suspense>
    </div>
  );
}
