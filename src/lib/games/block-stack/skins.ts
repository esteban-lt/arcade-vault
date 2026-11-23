import { DEFAULT_SKIN_ID, isSkinId, SKIN_BASE_TOKENS, SKIN_IDS, SKIN_LABELS, type SkinId } from "../shared/skins";
import type { PieceType } from "./constants";

export { DEFAULT_SKIN_ID, isSkinId, SKIN_IDS };
export type { SkinId };

export type BlockStyle = "bevel" | "outline" | "pixel" | "crystal";

// Holographic glass: faceted translucent blocks with an iridescent edge and a moving shimmer band.
export type CrystalStyle = {
  fillAlpha: number; // translucent body of the block
  facetLightColor: string; // top-left triangle
  facetShadeColor: string; // bottom-right triangle
  edgeSaturationPercent: number; // iridescent edge, hsl saturation
  edgeLightnessPercent: number; // iridescent edge, hsl lightness
  edgeBaseHueDegrees: number;
  hueSpeedDegreesPerSecond: number; // hue drift driven by the rAF clock
  hueSpreadDegrees: number; // hue difference between the two ends of an edge gradient
  shimmerColor: string; // refraction band
  shimmerPeriodSeconds: number; // time the band takes to cross a block
  shimmerWidthPixels: number;
};

export type BlockStackSkin = {
  id: SkinId;
  label: string; // Spanish label shown in the selector
  backgroundColor: string; // whole canvas
  boardBackgroundColor: string; // well and "next" box
  boardBorderColor: string;
  boardBorderWidthPixels: number;
  gridLineColor: string;
  gridLineWidthPixels: number;
  pieceColors: Readonly<Record<PieceType, string>>; // I, O, T, S, Z, J, L
  blockStyle: BlockStyle;
  blockInsetPixels: number;
  blockHighlightColor: string; // bevel: top band / pixel: top and left bands
  blockHighlightSizePixels: number;
  blockShadeColor: string | null; // pixel: bottom and right bands
  ghostAlpha: number;
  glowBlurPixels: number; // shadowBlur of blocks and borders; 0 = no glow
  textGlowBlurPixels: number; // shadowBlur of panel text; 0 = no glow
  panelLabelColor: string;
  panelValueColor: string;
  panelTextColor: string;
  fontFamily: string; // used when fontCssVariable is null or unresolved
  fontCssVariable: string | null; // CSS custom property holding the app font family
  headingFontWeight: "bold" | "normal"; // labels and the line counter
  labelFontSizePixels: number;
  valueFontSizePixels: number;
  controlFontSizePixels: number;
  isPixelated: boolean; // imageSmoothingEnabled = false, integer geometry
  crystal: CrystalStyle | null; // only used by blockStyle "crystal" and its iridescent frames
};

const MONOSPACE_FONT_FAMILY = '"Courier New", monospace';

export const SKINS: Readonly<Record<SkinId, BlockStackSkin>> = {
  classic: {
    id: "classic",
    label: SKIN_LABELS.classic,
    backgroundColor: "#000",
    boardBackgroundColor: "#1a1a25",
    boardBorderColor: "#2a2a3a",
    boardBorderWidthPixels: 1,
    gridLineColor: "#22222e",
    gridLineWidthPixels: 0.5,
    pieceColors: { 1: "#4dd0e1", 2: "#ffd54f", 3: "#ba68c8", 4: "#81c784", 5: "#e57373", 6: "#90caf9", 7: "#ffb74d" },
    blockStyle: "bevel",
    blockInsetPixels: 1,
    blockHighlightColor: "rgba(255,255,255,0.12)",
    blockHighlightSizePixels: 4,
    blockShadeColor: null,
    ghostAlpha: 0.2,
    glowBlurPixels: 0,
    textGlowBlurPixels: 0,
    panelLabelColor: "#555570",
    panelValueColor: "#7aa2f7",
    panelTextColor: "#888888",
    fontFamily: MONOSPACE_FONT_FAMILY,
    fontCssVariable: null,
    headingFontWeight: "bold",
    labelFontSizePixels: 12,
    valueFontSizePixels: 32,
    controlFontSizePixels: 14,
    isPixelated: false,
    crystal: null,
  },
  neon: {
    id: "neon",
    label: SKIN_LABELS.neon,
    backgroundColor: SKIN_BASE_TOKENS.neon.backgroundColor,
    boardBackgroundColor: "#08041a",
    boardBorderColor: "#00f5ff",
    boardBorderWidthPixels: 2,
    gridLineColor: "rgba(0,245,255,0.10)",
    gridLineWidthPixels: 1,
    pieceColors: { 1: "#00f5ff", 2: "#f5ff00", 3: "#d400ff", 4: "#39ff14", 5: "#ff006e", 6: "#3d7bff", 7: "#ff8a00" },
    blockStyle: "outline",
    blockInsetPixels: 2,
    blockHighlightColor: "rgba(255,255,255,0.12)",
    blockHighlightSizePixels: 4,
    blockShadeColor: null,
    ghostAlpha: 0.35,
    glowBlurPixels: SKIN_BASE_TOKENS.neon.glowBlurPixels,
    textGlowBlurPixels: 6,
    panelLabelColor: "#00f5ff",
    panelValueColor: "#f5ff00",
    panelTextColor: "#c8c8ff",
    fontFamily: MONOSPACE_FONT_FAMILY,
    fontCssVariable: null,
    headingFontWeight: "bold",
    labelFontSizePixels: 12,
    valueFontSizePixels: 32,
    controlFontSizePixels: 14,
    isPixelated: false,
    crystal: null,
  },
  "pixel-art": {
    id: "pixel-art",
    label: SKIN_LABELS["pixel-art"],
    backgroundColor: SKIN_BASE_TOKENS["pixel-art"].backgroundColor,
    boardBackgroundColor: "#1d1b3a",
    boardBorderColor: "#f4f4f4",
    boardBorderWidthPixels: 2,
    gridLineColor: "#2a2750",
    gridLineWidthPixels: 1,
    pieceColors: { 1: "#41d6f5", 2: "#ffd23f", 3: "#b45cff", 4: "#5be37d", 5: "#ff5964", 6: "#4d7cff", 7: "#ff9f43" },
    blockStyle: "pixel",
    blockInsetPixels: 1,
    blockHighlightColor: "rgba(255,255,255,0.35)",
    blockHighlightSizePixels: 4,
    blockShadeColor: "rgba(0,0,0,0.30)",
    ghostAlpha: 0.3,
    glowBlurPixels: 0,
    textGlowBlurPixels: 0,
    panelLabelColor: "#ff9f43",
    panelValueColor: "#ffd23f",
    panelTextColor: "#d8d8f0",
    fontFamily: "monospace",
    fontCssVariable: SKIN_BASE_TOKENS["pixel-art"].fontCssVariable,
    headingFontWeight: "normal",
    labelFontSizePixels: 10,
    valueFontSizePixels: 24,
    controlFontSizePixels: 8,
    isPixelated: true,
    crystal: null,
  },
  experimental: {
    id: "experimental",
    label: SKIN_LABELS.experimental,
    backgroundColor: "#070b1a",
    boardBackgroundColor: "#0d1430",
    boardBorderColor: "#9fb8ff",
    boardBorderWidthPixels: 2,
    gridLineColor: "rgba(150,180,255,0.10)",
    gridLineWidthPixels: 1,
    pieceColors: { 1: "#7fe9ff", 2: "#ffe9a8", 3: "#d6a8ff", 4: "#a8ffd6", 5: "#ffa8c8", 6: "#a8c4ff", 7: "#ffc8a0" },
    blockStyle: "crystal",
    blockInsetPixels: 1,
    blockHighlightColor: "rgba(255,255,255,0.12)",
    blockHighlightSizePixels: 4,
    blockShadeColor: null,
    ghostAlpha: 0.3,
    glowBlurPixels: 0,
    textGlowBlurPixels: 0,
    panelLabelColor: "#9fb8ff",
    panelValueColor: "#e9f4ff",
    panelTextColor: "#aab6dd",
    fontFamily: MONOSPACE_FONT_FAMILY,
    fontCssVariable: null,
    headingFontWeight: "bold",
    labelFontSizePixels: 12,
    valueFontSizePixels: 32,
    controlFontSizePixels: 14,
    isPixelated: false,
    crystal: {
      fillAlpha: 0.5,
      facetLightColor: "rgba(255,255,255,0.35)",
      facetShadeColor: "rgba(10,20,60,0.30)",
      edgeSaturationPercent: 90,
      edgeLightnessPercent: 75,
      edgeBaseHueDegrees: 190,
      hueSpeedDegreesPerSecond: 30,
      hueSpreadDegrees: 90,
      shimmerColor: "rgba(255,255,255,0.45)",
      shimmerPeriodSeconds: 3,
      shimmerWidthPixels: 6,
    },
  },
};
