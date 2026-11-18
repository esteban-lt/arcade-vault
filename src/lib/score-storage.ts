export type SavedScore = {
  gameId: string;
  playerName: string;
  score: number;
  savedAt: number;
};

export const SCORES_STORAGE_KEY = "arcade-vault:scores:v1";

function readSavedScores(): SavedScore[] {
  try {
    const rawValue = window.localStorage.getItem(SCORES_STORAGE_KEY);
    const parsedValue: unknown = rawValue ? JSON.parse(rawValue) : [];
    return Array.isArray(parsedValue) ? (parsedValue as SavedScore[]) : [];
  } catch {
    return [];
  }
}

export function saveScore(entry: Omit<SavedScore, "savedAt">): void {
  try {
    const savedScores = readSavedScores();
    savedScores.push({ ...entry, savedAt: Date.now() });
    window.localStorage.setItem(SCORES_STORAGE_KEY, JSON.stringify(savedScores));
  } catch {
    // localStorage unavailable (e.g. private mode): the score is simply not persisted.
  }
}
