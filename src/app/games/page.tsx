import { Library } from "@/components/library";
import { getAllGameStats } from "@/lib/leaderboard";

export default function GamesPage() {
  // Not awaited: each card resolves it inside its own <Suspense>, read on every request.
  const gameStatsPromise = getAllGameStats();
  return <Library gameStatsPromise={gameStatsPromise} />;
}
