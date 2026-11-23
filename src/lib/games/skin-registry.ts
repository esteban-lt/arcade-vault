// Games that use the global skin selector of the player (the engine implements setSkin).
// The rest keep handling their skin themselves until they are migrated.
// One id per line, so several games can be added without editing the same line.
const GAME_IDS_WITH_GLOBAL_SKINS: ReadonlySet<string> = new Set<string>([
]);

export function hasGlobalSkins(gameId: string): boolean {
  return GAME_IDS_WITH_GLOBAL_SKINS.has(gameId);
}
