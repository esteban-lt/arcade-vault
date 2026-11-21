import { createAsteroidsEngine } from "./asteroids/asteroids-engine";
import { createBlockStackEngine } from "./block-stack/block-stack-engine";
import { createFruitSnakeEngine } from "./fruit-snake/fruit-snake-engine";
import type { GameEngineFactory } from "./game-engine";
import { createWallBreakerEngine } from "./wall-breaker/wall-breaker-engine";

// Games with a real engine, keyed by game id. Games missing here keep the
// simulated player until they get their own engine.
export const GAME_ENGINE_FACTORIES: Record<string, GameEngineFactory> = {
  asteroids: createAsteroidsEngine,
  "block-stack": createBlockStackEngine,
  "wall-breaker": createWallBreakerEngine,
  "fruit-snake": createFruitSnakeEngine,
};

export function findGameEngineFactory(gameId: string): GameEngineFactory | undefined {
  return Object.hasOwn(GAME_ENGINE_FACTORIES, gameId) ? GAME_ENGINE_FACTORIES[gameId] : undefined;
}
