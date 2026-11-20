// Values ported unchanged from references/started-games/02-asteroids/game.js.

export const GAME_KEY_CODES = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Space"] as const;

export type AsteroidSize = 1 | 2 | 3; // 1 = small, 3 = large

export const ASTEROID_RADIUS_BY_SIZE = { 1: 16, 2: 30, 3: 50 } as const;
export const ASTEROID_SPEED_BY_SIZE = { 1: 85, 2: 55, 3: 32 } as const;
export const ASTEROID_POINTS_BY_SIZE = { 1: 100, 2: 50, 3: 20 } as const;

export const INITIAL_LIVES = 3;
export const INITIAL_ASTEROID_COUNT = 4; // level 1; later levels spawn 3 + level
export const ASTEROID_SAFE_DISTANCE = 130; // from the screen center
export const RESPAWN_DELAY_SECONDS = 2;
export const SPAWN_INVINCIBILITY_SECONDS = 3;
export const SHIP_COLLISION_RADIUS_FACTOR = 0.82; // asteroid radius fudge for feel
export const POWER_UP_DROP_CHANCE = 0.15;
export const POWER_UP_GUARANTEED_AFTER_KILLS = 5;
export const POWER_UP_DURATION_SECONDS = 5;
export const POWER_UP_LIFETIME_SECONDS = 12;
export const TRIPLE_SHOT_SPREAD_RADIANS = 0.18;
