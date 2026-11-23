import { SKIN_BASE_TOKENS, SKIN_LABELS, type SkinId } from "../shared/skins";
import type { AsteroidSize } from "./constants";

export { DEFAULT_SKIN_ID, isSkinId, SKIN_IDS, type SkinId } from "../shared/skins";

export type BulletShape = "circle" | "square" | "cross";

export type AsteroidsSkin = {
  id: SkinId;
  label: string; // Spanish label shown in the selector
  backgroundColor: string; // whole canvas
  shipColor: string;
  shipLineWidthPixels: number;
  shipFlameColor: string;
  asteroidColors: Readonly<Record<AsteroidSize, string>>; // 1 = small, 3 = large
  asteroidLineWidthPixels: number;
  bulletColor: string;
  bulletShape: BulletShape;
  bulletSizePixels: number; // circle: radius / square: side
  particleColor: string; // fades out with globalAlpha
  powerUpColor: string; // pickup and the "3x" indicator
  powerUpLineWidthPixels: number;
  glowBlurPixels: number; // shadowBlur of lines and text; 0 = no glow
  fontFamily: string; // used when fontCssVariable is null or unresolved
  fontCssVariable: string | null; // CSS custom property holding the app font family
  powerUpFontWeight: "bold" | "normal";
  powerUpFontSizePixels: number;
  indicatorFontSizePixels: number;
  isPixelated: boolean; // imageSmoothingEnabled = false, shapes drawn as grid blocks
  pixelSizePixels: number; // block side when isPixelated
  asteroidDashPatterns: Readonly<Record<AsteroidSize, readonly number[]>>; // [] = solid line
  powerUpDashPattern: readonly number[];
  blueprint: BlueprintStyle | null; // drafting-paper decoration; null = none
};

// Technical-drawing decoration: background grid, ship heading line and dimension marks.
export type BlueprintStyle = {
  gridColor: string;
  majorGridColor: string;
  gridSpacingPixels: number;
  majorGridEvery: number; // every Nth line uses majorGridColor
  annotationColor: string;
  annotationLineWidthPixels: number;
  headingLengthPixels: number; // dashed line ahead of the ship nose
  headingDashPattern: readonly number[];
  dimensionMarkSizePixels: number; // center cross arm and dimension end tick
};

export const SKINS: Readonly<Record<SkinId, AsteroidsSkin>> = {
  classic: {
    id: "classic",
    label: SKIN_LABELS.classic,
    backgroundColor: "#000",
    shipColor: "#fff",
    shipLineWidthPixels: 1.5,
    shipFlameColor: "rgba(255, 130, 0, 0.85)",
    asteroidColors: { 1: "#fff", 2: "#fff", 3: "#fff" },
    asteroidLineWidthPixels: 1.5,
    bulletColor: "#fff",
    bulletShape: "circle",
    bulletSizePixels: 2,
    particleColor: "#fff",
    powerUpColor: "#0ff",
    powerUpLineWidthPixels: 2,
    glowBlurPixels: 0,
    fontFamily: "monospace",
    fontCssVariable: null,
    powerUpFontWeight: "bold",
    powerUpFontSizePixels: 12,
    indicatorFontSizePixels: 15,
    isPixelated: false,
    pixelSizePixels: 1,
    asteroidDashPatterns: { 1: [], 2: [], 3: [] },
    powerUpDashPattern: [],
    blueprint: null,
  },
  neon: {
    id: "neon",
    label: SKIN_LABELS.neon,
    backgroundColor: SKIN_BASE_TOKENS.neon.backgroundColor,
    shipColor: "#00f5ff",
    shipLineWidthPixels: 2,
    shipFlameColor: "#ff8a00",
    asteroidColors: { 1: "#f5ff00", 2: "#d400ff", 3: "#ff006e" },
    asteroidLineWidthPixels: 2,
    bulletColor: "#f5ff00",
    bulletShape: "circle",
    bulletSizePixels: 3,
    particleColor: "#ff8a00",
    powerUpColor: "#39ff14",
    powerUpLineWidthPixels: 2,
    glowBlurPixels: SKIN_BASE_TOKENS.neon.glowBlurPixels,
    fontFamily: "monospace",
    fontCssVariable: null,
    powerUpFontWeight: "bold",
    powerUpFontSizePixels: 12,
    indicatorFontSizePixels: 15,
    isPixelated: false,
    pixelSizePixels: 1,
    asteroidDashPatterns: { 1: [], 2: [], 3: [] },
    powerUpDashPattern: [],
    blueprint: null,
  },
  "pixel-art": {
    id: "pixel-art",
    label: SKIN_LABELS["pixel-art"],
    backgroundColor: SKIN_BASE_TOKENS["pixel-art"].backgroundColor,
    shipColor: "#41d6f5",
    shipLineWidthPixels: 4,
    shipFlameColor: "#ff9f43",
    asteroidColors: { 1: "#ff5964", 2: "#ff9f43", 3: "#b45cff" },
    asteroidLineWidthPixels: 4,
    bulletColor: "#ffd23f",
    bulletShape: "square",
    bulletSizePixels: 4,
    particleColor: "#f4f4f4",
    powerUpColor: "#5be37d",
    powerUpLineWidthPixels: 4,
    glowBlurPixels: 0,
    fontFamily: "monospace",
    fontCssVariable: SKIN_BASE_TOKENS["pixel-art"].fontCssVariable,
    powerUpFontWeight: "normal",
    powerUpFontSizePixels: 8,
    indicatorFontSizePixels: 10,
    isPixelated: true,
    pixelSizePixels: 4,
    asteroidDashPatterns: { 1: [], 2: [], 3: [] },
    powerUpDashPattern: [],
    blueprint: null,
  },
  // Blueprint: deep blue drafting paper, thin white-cyan construction lines. Roles differ by
  // line style (solid / dashed / dotted rocks, cross bullets, dashed pickup), not by hue.
  experimental: {
    id: "experimental",
    label: SKIN_LABELS.experimental,
    backgroundColor: "#0a2a5e",
    shipColor: "#f2fbff",
    shipLineWidthPixels: 1.5,
    shipFlameColor: "#7fe3ff",
    asteroidColors: { 1: "#8fd3ff", 2: "#bfe9ff", 3: "#f2fbff" },
    asteroidLineWidthPixels: 1.5,
    bulletColor: "#ffffff",
    bulletShape: "cross",
    bulletSizePixels: 4,
    particleColor: "#bfe9ff",
    powerUpColor: "#ffe27a",
    powerUpLineWidthPixels: 1.5,
    glowBlurPixels: 0,
    fontFamily: "monospace",
    fontCssVariable: null,
    powerUpFontWeight: "bold",
    powerUpFontSizePixels: 11,
    indicatorFontSizePixels: 14,
    isPixelated: false,
    pixelSizePixels: 1,
    asteroidDashPatterns: { 1: [2, 3], 2: [10, 4], 3: [] },
    powerUpDashPattern: [4, 3],
    blueprint: {
      gridColor: "rgba(180, 220, 255, 0.10)",
      majorGridColor: "rgba(180, 220, 255, 0.22)",
      gridSpacingPixels: 40,
      majorGridEvery: 5,
      annotationColor: "rgba(191, 233, 255, 0.55)",
      annotationLineWidthPixels: 1,
      headingLengthPixels: 90,
      headingDashPattern: [6, 5],
      dimensionMarkSizePixels: 4,
    },
  },
};
