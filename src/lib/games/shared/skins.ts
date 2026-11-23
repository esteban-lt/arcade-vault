// Skin infrastructure shared by every game: ids, labels and persistence.
// Each game keeps its own skin type and drawing code; only what is identical lives here.

export type SkinId = "classic" | "neon" | "pixel-art" | "experimental";
export const SKIN_IDS: readonly SkinId[] = ["classic", "neon", "pixel-art", "experimental"];
export const DEFAULT_SKIN_ID: SkinId = "classic";
export const SKIN_LABELS: Readonly<Record<SkinId, string>> = {
  classic: "Clásico",
  neon: "Neón",
  "pixel-art": "Pixel art",
  experimental: "Experimental",
};

// Only values that are identical in the 4 games today.
export const SKIN_BASE_TOKENS = {
  neon: { backgroundColor: "#05020d", glowBlurPixels: 12 },
  "pixel-art": { backgroundColor: "#14122b", fontCssVariable: "--font-press-start" },
} as const;

const SKIN_STORAGE_KEY_PREFIX = "arcade-vault:skin:";

export function skinStorageKey(gameId: string): string {
  return SKIN_STORAGE_KEY_PREFIX + gameId;
}

export function isSkinId(value: unknown): value is SkinId {
  return SKIN_IDS.some((skinId) => skinId === value);
}

// Falls back to the default skin when the value is empty, invalid or storage is unavailable.
export function readStoredSkinId(gameId: string): SkinId {
  try {
    const storedValue = window.localStorage.getItem(skinStorageKey(gameId));
    return isSkinId(storedValue) ? storedValue : DEFAULT_SKIN_ID;
  } catch {
    return DEFAULT_SKIN_ID;
  }
}

export function writeStoredSkinId(gameId: string, skinId: SkinId): void {
  try {
    window.localStorage.setItem(skinStorageKey(gameId), skinId);
  } catch {
    // Storage may be blocked or full: the skin simply is not remembered.
  }
}
