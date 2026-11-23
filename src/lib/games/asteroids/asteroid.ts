import { CANVAS_HEIGHT, CANVAS_WIDTH } from "../shared/canvas";
import {
  ASTEROID_RADIUS_BY_SIZE,
  ASTEROID_SPEED_BY_SIZE,
  type AsteroidSize,
} from "./constants";
import { randomBetween, randomIntegerBetween, wrapCoordinate } from "../shared/math";
import { drawDimensionMarks, strokePath, toWorldPoint, type Point } from "./skin-draw";
import type { AsteroidsSkin } from "./skins";

export class Asteroid {
  x: number;
  y: number;
  readonly size: AsteroidSize;
  readonly radius: number;
  isDead = false;
  private readonly velocityX: number;
  private readonly velocityY: number;
  private readonly rotationSpeed: number;
  private rotation: number;
  // Irregular polygon, in coordinates relative to the asteroid center.
  private readonly vertices: Point[] = [];

  constructor(x: number, y: number, size: AsteroidSize = 3) {
    this.x = x;
    this.y = y;
    this.size = size;
    this.radius = ASTEROID_RADIUS_BY_SIZE[size];

    const angle = randomBetween(0, Math.PI * 2);
    const speed = ASTEROID_SPEED_BY_SIZE[size] + randomBetween(-15, 15);
    this.velocityX = Math.cos(angle) * speed;
    this.velocityY = Math.sin(angle) * speed;
    this.rotationSpeed = randomBetween(-1.2, 1.2);
    this.rotation = randomBetween(0, Math.PI * 2);

    const vertexCount = randomIntegerBetween(8, 13);
    for (let index = 0; index < vertexCount; index++) {
      const vertexAngle = (index / vertexCount) * Math.PI * 2;
      const vertexRadius = this.radius * randomBetween(0.6, 1.0);
      this.vertices.push([Math.cos(vertexAngle) * vertexRadius, Math.sin(vertexAngle) * vertexRadius]);
    }
  }

  update(deltaSeconds: number): void {
    this.x = wrapCoordinate(this.x + this.velocityX * deltaSeconds, CANVAS_WIDTH);
    this.y = wrapCoordinate(this.y + this.velocityY * deltaSeconds, CANVAS_HEIGHT);
    this.rotation += this.rotationSpeed * deltaSeconds;
  }

  // Small asteroids (size 1) do not split.
  split(): Asteroid[] {
    if (this.size <= 1) return [];
    const smallerSize = (this.size - 1) as AsteroidSize;
    return [
      new Asteroid(this.x, this.y, smallerSize),
      new Asteroid(this.x, this.y, smallerSize),
    ];
  }

  draw(context: CanvasRenderingContext2D, skin: AsteroidsSkin): void {
    const worldVertices = this.vertices.map((vertex) => toWorldPoint(vertex, this.x, this.y, this.rotation));
    strokePath(
      context,
      skin,
      worldVertices,
      skin.asteroidColors[this.size],
      skin.asteroidLineWidthPixels,
      true,
      skin.asteroidDashPatterns[this.size],
    );
    drawDimensionMarks(context, skin, this.x, this.y, this.radius, this.size === 3);
  }
}
