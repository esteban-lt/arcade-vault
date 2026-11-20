export type Point = { x: number; y: number };

// Toroidal wrapping: a coordinate leaving one edge re-enters from the opposite one.
export function wrapCoordinate(value: number, maximum: number): number {
  return ((value % maximum) + maximum) % maximum;
}

export function distanceBetween(first: Point, second: Point): number {
  return Math.hypot(first.x - second.x, first.y - second.y);
}

export function randomBetween(minimum: number, maximum: number): number {
  return minimum + Math.random() * (maximum - minimum);
}

// Both bounds are inclusive.
export function randomIntegerBetween(minimum: number, maximum: number): number {
  return Math.floor(randomBetween(minimum, maximum + 1));
}
