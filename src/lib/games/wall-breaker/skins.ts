import { SKIN_BASE_TOKENS, SKIN_LABELS, type SkinId } from "../shared/skins";
import type { BlockColor } from "./constants";

export { DEFAULT_SKIN_ID, isSkinId, SKIN_IDS, type SkinId } from "../shared/skins";

export type BlockPattern = "solid" | "outline";
export type BallShape = "circle" | "square";

// Animated backdrop of the experimental skin: sunset, sun with cut bands and a scrolling perspective floor.
export type SynthwaveScene = {
  horizonYPixels: number;
  skyStops: readonly (readonly [number, string])[]; // gradient offsets 0..1 over the whole canvas height
  sunRadiusPixels: number;
  sunTopColor: string;
  sunBottomColor: string;
  sunBandColor: string;
  floorTopColor: string;
  floorBottomColor: string;
  gridColor: string;
  gridScrollCyclesPerSecond: number;
};

export type WallBreakerSkin = {
  id: SkinId;
  label: string; // Spanish label shown in the selector
  backgroundColor: string; // whole canvas
  scene: SynthwaveScene | null; // drawn over backgroundColor when present
  blockColors: Readonly<Record<BlockColor, string>>;
  blockPatterns: Readonly<Record<BlockColor, BlockPattern>>;
  blockInsetPixels: number;
  blockHighlightColor: string; // top strip of solid blocks
  blockHighlightHeightPixels: number; // 0 = none
  blockShadeColor: string; // bottom strip of solid blocks
  blockShadeHeightPixels: number; // 0 = none
  blockOutlineWidthPixels: number; // stroke of "outline" blocks
  blockOutlineFillAlpha: number; // fill of "outline" blocks
  paddleColor: string;
  paddleEndColor: string;
  paddleEndWidthPixels: number;
  ballColor: string;
  ballShape: BallShape;
  ballOutlineColor: string | null;
  ballOutlineWidthPixels: number;
  glowBlurPixels: number; // shadowBlur of paddle and ball; 0 = no glow
  blockGlowBlurPixels: number; // shadowBlur of blocks; 0 = no glow
  isPixelated: boolean; // imageSmoothingEnabled = false, integer coordinates
};

const ALL_SOLID: Readonly<Record<BlockColor, BlockPattern>> = {
  red: "solid",
  yellow: "solid",
  cyan: "solid",
  magenta: "solid",
  hotpink: "solid",
  green: "solid",
  gray: "solid",
};
const ALL_OUTLINE: Readonly<Record<BlockColor, BlockPattern>> = {
  red: "outline",
  yellow: "outline",
  cyan: "outline",
  magenta: "outline",
  hotpink: "outline",
  green: "outline",
  gray: "outline",
};

export const SKINS: Readonly<Record<SkinId, WallBreakerSkin>> = {
  classic: {
    id: "classic",
    label: SKIN_LABELS.classic,
    backgroundColor: "#000",
    scene: null,
    blockColors: {
      red: "#d83a4a",
      yellow: "#e8b830",
      cyan: "#3aa8e0",
      magenta: "#7a4ee0",
      hotpink: "#e05aa0",
      green: "#3cc08a",
      gray: "#6a6a7a",
    },
    blockPatterns: ALL_SOLID,
    blockInsetPixels: 1,
    blockHighlightColor: "rgba(255,255,255,0.25)",
    blockHighlightHeightPixels: 3,
    blockShadeColor: "rgba(0,0,0,0)",
    blockShadeHeightPixels: 0,
    blockOutlineWidthPixels: 2,
    blockOutlineFillAlpha: 0.2,
    paddleColor: "#d8d8e0",
    paddleEndColor: "#d83a4a",
    paddleEndWidthPixels: 6,
    ballColor: "#e0e0e8",
    ballShape: "circle",
    ballOutlineColor: null,
    ballOutlineWidthPixels: 0,
    glowBlurPixels: 0,
    blockGlowBlurPixels: 0,
    isPixelated: false,
  },
  neon: {
    id: "neon",
    label: SKIN_LABELS.neon,
    backgroundColor: SKIN_BASE_TOKENS.neon.backgroundColor,
    scene: null,
    blockColors: {
      red: "#ff006e",
      yellow: "#f5ff00",
      cyan: "#00f5ff",
      magenta: "#d400ff",
      hotpink: "#ff4fd8",
      green: "#39ff14",
      gray: "#9aa0c8",
    },
    blockPatterns: ALL_OUTLINE,
    blockInsetPixels: 2,
    blockHighlightColor: "rgba(0,0,0,0)",
    blockHighlightHeightPixels: 0,
    blockShadeColor: "rgba(0,0,0,0)",
    blockShadeHeightPixels: 0,
    blockOutlineWidthPixels: 2,
    blockOutlineFillAlpha: 0.22,
    paddleColor: "#00f5ff",
    paddleEndColor: "#ff006e",
    paddleEndWidthPixels: 6,
    ballColor: "#f5ff00",
    ballShape: "circle",
    ballOutlineColor: null,
    ballOutlineWidthPixels: 0,
    glowBlurPixels: SKIN_BASE_TOKENS.neon.glowBlurPixels,
    blockGlowBlurPixels: 8,
    isPixelated: false,
  },
  "pixel-art": {
    id: "pixel-art",
    label: SKIN_LABELS["pixel-art"],
    backgroundColor: SKIN_BASE_TOKENS["pixel-art"].backgroundColor,
    scene: null,
    blockColors: {
      red: "#ff5964",
      yellow: "#ffd23f",
      cyan: "#41d6f5",
      magenta: "#b45cff",
      hotpink: "#ff9f43",
      green: "#5be37d",
      gray: "#d8d8f0",
    },
    blockPatterns: ALL_SOLID,
    blockInsetPixels: 2,
    blockHighlightColor: "rgba(255,255,255,0.35)",
    blockHighlightHeightPixels: 4,
    blockShadeColor: "rgba(0,0,0,0.30)",
    blockShadeHeightPixels: 4,
    blockOutlineWidthPixels: 4,
    blockOutlineFillAlpha: 0.2,
    paddleColor: "#f4f4f4",
    paddleEndColor: "#ff5964",
    paddleEndWidthPixels: 8,
    ballColor: "#ffd23f",
    ballShape: "square",
    ballOutlineColor: null,
    ballOutlineWidthPixels: 0,
    glowBlurPixels: 0,
    blockGlowBlurPixels: 0,
    isPixelated: true,
  },
  // Synthwave sunset: gradient sky, banded sun and a scrolling perspective grid under the play area.
  experimental: {
    id: "experimental",
    label: SKIN_LABELS.experimental,
    backgroundColor: "#0d0221",
    scene: {
      horizonYPixels: 400,
      skyStops: [
        [0, "#0d0221"],
        [0.4, "#2b0a52"],
        [0.67, "#9a1f86"],
      ],
      sunRadiusPixels: 120,
      sunTopColor: "#ffe45e",
      sunBottomColor: "#ff2a8a",
      sunBandColor: "#8a1d84",
      floorTopColor: "#1a0536",
      floorBottomColor: "#3a0a5c",
      gridColor: "#ff2fd0",
      gridScrollCyclesPerSecond: 0.35,
    },
    blockColors: {
      red: "#ff3d6e",
      yellow: "#ffe45e",
      cyan: "#2ff3ff",
      magenta: "#b26bff",
      hotpink: "#ff4fd8",
      green: "#4dffb0",
      gray: "#c9c3e8",
    },
    blockPatterns: ALL_SOLID,
    blockInsetPixels: 1,
    blockHighlightColor: "rgba(255,255,255,0.4)",
    blockHighlightHeightPixels: 5,
    blockShadeColor: "rgba(13,2,33,0.35)",
    blockShadeHeightPixels: 4,
    blockOutlineWidthPixels: 2,
    blockOutlineFillAlpha: 0.2,
    paddleColor: "#2ff3ff",
    paddleEndColor: "#ff4fd8",
    paddleEndWidthPixels: 6,
    ballColor: "#ffffff",
    ballShape: "circle",
    ballOutlineColor: "#0d0221",
    ballOutlineWidthPixels: 2,
    glowBlurPixels: 12,
    blockGlowBlurPixels: 8,
    isPixelated: false,
  },
};
