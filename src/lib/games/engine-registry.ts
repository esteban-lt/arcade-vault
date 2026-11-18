import { createAsteroidsEngine } from "./asteroids/asteroids-engine";
import type { GameEngineFactory } from "./game-engine";

// Games with a real engine, keyed by game id. Games missing here keep the
// simulated player until they get their own engine.
export const GAME_ENGINE_FACTORIES: Record<string, GameEngineFactory> = {
  asteroids: createAsteroidsEngine,
};

export function findGameEngineFactory(gameId: string): GameEngineFactory | undefined {
  return Object.hasOwn(GAME_ENGINE_FACTORIES, gameId) ? GAME_ENGINE_FACTORIES[gameId] : undefined;
}
