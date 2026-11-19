// Leaderboard rules and formatting shared by server and client code (no Supabase imports).

// Mirrors the scores_score_range check constraint in the database.
export const MINIMUM_SCORE = 1;
export const MAXIMUM_SCORE = 9_999_999;
export const GAME_DETAIL_LEADERBOARD_SIZE = 10;
export const HALL_OF_FAME_TABLE_SIZE = 12;

export type LeaderboardEntry = {
  rank: number;
  userId: string;
  playerName: string; // profile username in uppercase
  score: number;
  achievedAt: string; // ISO timestamp
};

export type GameStats = {
  gameId: string;
  bestScore: number | null; // null when the game has no scores yet
  scoreCount: number;
};

export function isValidScore(score: number): boolean {
  return Number.isInteger(score) && score >= MINIMUM_SCORE && score <= MAXIMUM_SCORE;
}

// Used by every screen that shows a game's stats, so a game missing from the table looks empty.
export function findGameStats(stats: Record<string, GameStats>, gameId: string): GameStats {
  return stats[gameId] ?? { gameId, bestScore: null, scoreCount: 0 };
}

export function formatScore(score: number): string {
  return score.toLocaleString("es-ES");
}

// "—" when the game has no scores yet.
export function formatBestScore(bestScore: number | null): string {
  return bestScore === null ? "—" : formatScore(bestScore);
}

// 0 → "NUEVO", 950 → "950", 1234 → "1.2K", 31800 → "31.8K", 2500000 → "2.5M".
export function formatScoreCount(scoreCount: number): string {
  if (scoreCount === 0) return "NUEVO";
  if (scoreCount < 1000) return String(scoreCount);
  const [divisor, suffix] = scoreCount < 1_000_000 ? [1000, "K"] : [1_000_000, "M"];
  return (scoreCount / divisor).toFixed(1).replace(/\.0$/, "") + suffix;
}

// dd/mm/yyyy in UTC, so server and client render the same text.
export function formatScoreDate(isoTimestamp: string): string {
  return new Date(isoTimestamp).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  });
}
