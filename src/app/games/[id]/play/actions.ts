"use server";

import { findGameById } from "@/lib/games";
import { isValidScore } from "@/lib/leaderboard";
import { createClient } from "@/lib/supabase/server";

export type SaveScoreResult =
  | { status: "saved" }
  | { status: "unauthenticated" }
  | { status: "invalid" } // unknown game, game without scores, score out of range
  | { status: "error" };

const GAME_ID_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

// Postgres errors that mean the row itself is not acceptable, not that the save failed:
// RLS rejection (game without scores or another user), check constraint, unknown game.
const REJECTED_ROW_ERROR_CODES = new Set(["42501", "23514", "23503"]);

export async function saveScoreAction(gameId: unknown, score: unknown): Promise<SaveScoreResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: "unauthenticated" };

  if (
    typeof gameId !== "string" ||
    !GAME_ID_PATTERN.test(gameId) ||
    !findGameById(gameId) ||
    typeof score !== "number" ||
    !isValidScore(score)
  ) {
    return { status: "invalid" };
  }

  const { error } = await supabase
    .from("scores")
    .insert({ game_id: gameId, user_id: user.id, score });

  if (!error) return { status: "saved" };
  if (REJECTED_ROW_ERROR_CODES.has(error.code)) return { status: "invalid" };

  console.error("Could not save the score:", error.message);
  return { status: "error" };
}
