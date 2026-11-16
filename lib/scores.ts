export type ScoreEntry = {
  rank: number;
  playerName: string;
  score: number;
  date: string;
};

const PLAYER_NAMES = [
  "PX_KAI", "NEONFOX", "Z3R0COOL", "M00NRYU", "VAULT_07", "GLITCHA",
  "ATARI_KID", "CYBER_LU", "MAGENTA88", "SCANLINE", "BIT_LORD", "ARKADYA",
  "DROID_X", "RGB_QUEEN", "PIXEL_DAD", "RETROVIRA", "VECTORX", "JOY_STK",
];

const MINIMUM_SCORE = 1000;

// Linear congruential generator: deterministic, so server and client render the same rows.
function createSeededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 9301 + 49297) % 233280;
    return state / 233280;
  };
}

function formatDate(day: number, month: number): string {
  return `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}/2026`;
}

export function generateSeededScores(seed: number, count = 12): ScoreEntry[] {
  const random = createSeededRandom(seed);
  const usedNames = new Set<string>();
  const entries: Omit<ScoreEntry, "rank">[] = [];

  for (let index = 0; index < count; index++) {
    let playerName: string;
    do {
      playerName = PLAYER_NAMES[Math.floor(random() * PLAYER_NAMES.length)];
    } while (usedNames.has(playerName) && usedNames.size < PLAYER_NAMES.length);
    usedNames.add(playerName);

    const baseScore = Math.floor(50000 + random() * 250000);
    const score = baseScore - index * Math.floor(2000 + random() * 4000);
    const day = 1 + Math.floor(random() * 28);
    const month = 1 + Math.floor(random() * 12);

    entries.push({
      playerName,
      score: Math.max(score, MINIMUM_SCORE),
      date: formatDate(day, month),
    });
  }

  return entries
    .sort((first, second) => second.score - first.score)
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
}
