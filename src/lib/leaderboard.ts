import { cache } from "react";
import type { GameStats, LeaderboardEntry } from "@/lib/leaderboard-format";
import { createClient } from "@/lib/supabase/server";

// Server-only reads of the leaderboard views (game_leaderboard, game_stats).
// They read the session cookies, so callers must render inside <Suspense>.
// Client components import the shared rules and formatters from leaderboard-format instead.

export * from "@/lib/leaderboard-format";

type LeaderboardRow = {
  game_id: string;
  user_id: string;
  username: string;
  score: number;
  achieved_at: string;
  rank: number;
};

type GameStatsRow = {
  game_id: string;
  best_score: number | null;
  score_count: number;
};

const LEADERBOARD_COLUMNS = "game_id, user_id, username, score, achieved_at, rank";

function toLeaderboardEntry(row: LeaderboardRow): LeaderboardEntry {
  return {
    rank: Number(row.rank),
    userId: row.user_id,
    playerName: row.username.toUpperCase(),
    score: row.score,
    achievedAt: row.achieved_at,
  };
}

export const getGameLeaderboard = cache(
  async (gameId: string, limit: number): Promise<LeaderboardEntry[]> => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("game_leaderboard")
      .select(LEADERBOARD_COLUMNS)
      .eq("game_id", gameId)
      .order("rank")
      .limit(limit)
      .overrideTypes<LeaderboardRow[], { merge: false }>();

    if (error) throw new Error(`Could not read the leaderboard of ${gameId}: ${error.message}`);
    return data.map(toLeaderboardEntry);
  },
);

// Every game in the games table, keyed by id; games without scores have bestScore null.
export const getAllGameStats = cache(async (): Promise<Record<string, GameStats>> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("game_stats")
    .select("game_id, best_score, score_count")
    .overrideTypes<GameStatsRow[], { merge: false }>();

  if (error) throw new Error(`Could not read the game stats: ${error.message}`);

  return Object.fromEntries(
    data.map((row) => [
      row.game_id,
      {
        gameId: row.game_id,
        bestScore: row.best_score === null ? null : Number(row.best_score),
        scoreCount: Number(row.score_count),
      },
    ]),
  );
});

export const getPlayerBest = cache(
  async (gameId: string, userId: string): Promise<LeaderboardEntry | null> => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("game_leaderboard")
      .select(LEADERBOARD_COLUMNS)
      .eq("game_id", gameId)
      .eq("user_id", userId)
      .maybeSingle()
      .overrideTypes<LeaderboardRow | null, { merge: false }>();

    if (error) throw new Error(`Could not read the best score of the player: ${error.message}`);
    return data ? toLeaderboardEntry(data) : null;
  },
);
