import { SKIN_BASE_TOKENS, SKIN_LABELS, type SkinId } from "../shared/skins";
import type { FruitKind } from "./constants";

export { DEFAULT_SKIN_ID, isSkinId, SKIN_IDS, type SkinId } from "../shared/skins";

export type SegmentStyle = "flat" | "outline" | "pixel" | "sticker";
export type EyeShape = "square" | "round";

export type FruitSnakeSkin = {
  id: SkinId;
  label: string; // Spanish label shown in the selector
  backgroundColor: string; // whole canvas
  gridLineColor: string;
  snakeBodyColor: string;
  snakeBodyAlternateColor: string | null; // odd body segments; null = all the same color
  snakeHeadColor: string;
  snakeCrashedHeadColor: string;
  snakeEyeColor: string;
  eyeShape: EyeShape;
  segmentStyle: SegmentStyle;
  segmentCornerRadiusPixels: number; // sticker only
  segmentOutlineWidthPixels: number; // outline: stroke width of segments
  fruitColors: Readonly<Record<FruitKind, string>>;
  fruitLeafColor: string;
  fruitStemColor: string;
  outlineColor: string | null; // sticker: ink stroke around segments and fruit; null = none
  outlineWidthPixels: number;
  shadowColor: string | null; // hard offset shadow (no blur); null = none
  shadowOffsetPixels: number;
  highlightColor: string | null; // pixel: top and left bands of a segment
  shadeColor: string | null; // pixel: bottom and right bands of a segment
  glowBlurPixels: number; // shadowBlur of snake and fruit; 0 = no glow
  isPixelated: boolean; // imageSmoothingEnabled = false, shapes made of blocks
  pixelSizePixels: number; // block size of pixelated shapes (divides the 20 px cell)
};

export const SKINS: Readonly<Record<SkinId, FruitSnakeSkin>> = {
  classic: {
    id: "classic",
    label: SKIN_LABELS.classic,
    backgroundColor: "#000",
    gridLineColor: "rgba(255,255,255,0.04)",
    snakeBodyColor: "#2fbf5a",
    snakeBodyAlternateColor: null,
    snakeHeadColor: "#7be08f",
    snakeCrashedHeadColor: "#e04848",
    snakeEyeColor: "#000",
    eyeShape: "square",
    segmentStyle: "flat",
    segmentCornerRadiusPixels: 0,
    segmentOutlineWidthPixels: 0,
    fruitColors: { apple: "#e03a3a", cherry: "#c8203a", lemon: "#f0d040", grape: "#8a4fd0" },
    fruitLeafColor: "#3cc05a",
    fruitStemColor: "#6a8a3a",
    outlineColor: null,
    outlineWidthPixels: 0,
    shadowColor: null,
    shadowOffsetPixels: 0,
    highlightColor: null,
    shadeColor: null,
    glowBlurPixels: 0,
    isPixelated: false,
    pixelSizePixels: 2,
  },
  neon: {
    id: "neon",
    label: SKIN_LABELS.neon,
    backgroundColor: SKIN_BASE_TOKENS.neon.backgroundColor,
    gridLineColor: "rgba(0,245,255,0.10)",
    snakeBodyColor: "#39ff14",
    snakeBodyAlternateColor: null,
    snakeHeadColor: "#00f5ff",
    snakeCrashedHeadColor: "#ff006e",
    snakeEyeColor: "#ffffff",
    eyeShape: "square",
    segmentStyle: "outline",
    segmentCornerRadiusPixels: 0,
    segmentOutlineWidthPixels: 2,
    fruitColors: { apple: "#ff006e", cherry: "#ff8a00", lemon: "#f5ff00", grape: "#d400ff" },
    fruitLeafColor: "#39ff14",
    fruitStemColor: "#c8c8ff",
    outlineColor: null,
    outlineWidthPixels: 0,
    shadowColor: null,
    shadowOffsetPixels: 0,
    highlightColor: null,
    shadeColor: null,
    glowBlurPixels: SKIN_BASE_TOKENS.neon.glowBlurPixels,
    isPixelated: false,
    pixelSizePixels: 2,
  },
  "pixel-art": {
    id: "pixel-art",
    label: SKIN_LABELS["pixel-art"],
    backgroundColor: SKIN_BASE_TOKENS["pixel-art"].backgroundColor,
    gridLineColor: "#1d1b3a",
    snakeBodyColor: "#5be37d",
    snakeBodyAlternateColor: null,
    snakeHeadColor: "#41d6f5",
    snakeCrashedHeadColor: "#ff5964",
    snakeEyeColor: "#14122b",
    eyeShape: "square",
    segmentStyle: "pixel",
    segmentCornerRadiusPixels: 0,
    segmentOutlineWidthPixels: 0,
    fruitColors: { apple: "#ff5964", cherry: "#ff9f43", lemon: "#ffd23f", grape: "#b45cff" },
    fruitLeafColor: "#5be37d",
    fruitStemColor: "#c98a4b",
    outlineColor: null,
    outlineWidthPixels: 0,
    shadowColor: null,
    shadowOffsetPixels: 0,
    highlightColor: "rgba(255,255,255,0.35)",
    shadeColor: "rgba(0,0,0,0.30)",
    glowBlurPixels: 0,
    isPixelated: true,
    pixelSizePixels: 2,
  },
  // Paper-cut / sticker look: cream paper, ink outlines, hard offset shadows, striped caterpillar.
  experimental: {
    id: "experimental",
    label: SKIN_LABELS.experimental,
    backgroundColor: "#f4ead5",
    gridLineColor: "rgba(43,27,23,0.07)",
    snakeBodyColor: "#f4a259",
    snakeBodyAlternateColor: "#f6c85f",
    snakeHeadColor: "#2a9d8f",
    snakeCrashedHeadColor: "#d00000",
    snakeEyeColor: "#2b1b17",
    eyeShape: "round",
    segmentStyle: "sticker",
    segmentCornerRadiusPixels: 6,
    segmentOutlineWidthPixels: 0,
    fruitColors: { apple: "#e63946", cherry: "#9d174d", lemon: "#ffd23f", grape: "#7b4fbf" },
    fruitLeafColor: "#2a9d8f",
    fruitStemColor: "#5a3e2b",
    outlineColor: "#2b1b17",
    outlineWidthPixels: 2,
    shadowColor: "rgba(43,27,23,0.30)",
    shadowOffsetPixels: 2,
    highlightColor: null,
    shadeColor: null,
    glowBlurPixels: 0,
    isPixelated: false,
    pixelSizePixels: 2,
  },
};
