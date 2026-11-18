import type { GameAccentColor } from "@/lib/games";

export type FeatureIconKind = "gamepad" | "free" | "trophy" | "rocket";
export type HighlightIconKind = "heart" | "browser" | "plant";

export type HomeFeature = {
  icon: FeatureIconKind;
  title: string;
  description: string;
  accentColor: GameAccentColor;
};

export type AboutHighlight = {
  icon: HighlightIconKind;
  text: string;
  accentColor: GameAccentColor;
};

export type HomeStat = {
  value: string;
  unit: string;
  caption: string;
};

export type RecentScore = {
  playerName: string;
  gameId: string;
  score: number;
  timeAgoLabel: string;
  accentColor: GameAccentColor;
};

export type TopPlayer = {
  rank: number;
  playerName: string;
  score: number;
};

export type PricingFaqItem = {
  question: string;
  answer: string;
};

export const HOME_FEATURES: HomeFeature[] = [
  {
    icon: "gamepad",
    title: "JUEGOS CLÁSICOS",
    description:
      "Arkanoid, Tetris, Snake y muchos más. Los mejores arcades de todos los tiempos en un solo lugar.",
    accentColor: "cyan",
  },
  {
    icon: "free",
    title: "100% GRATIS",
    description:
      "Sin suscripciones, sin pagos ocultos. Todos los juegos disponibles de forma gratuita.",
    accentColor: "yellow",
  },
  {
    icon: "trophy",
    title: "LADDER BOARDS",
    description:
      "Compite con jugadores de todo el mundo. Escala el ranking y demuestra quién es el mejor.",
    accentColor: "magenta",
  },
  {
    icon: "rocket",
    title: "SIEMPRE CRECIENDO",
    description:
      "Agregamos nuevos juegos constantemente. Vuelve seguido, siempre habrá algo nuevo que jugar.",
    accentColor: "green",
  },
];

export const ABOUT_HIGHLIGHTS: AboutHighlight[] = [
  { icon: "heart", text: "HECHO CON ❤️ PARA JUGADORES", accentColor: "magenta" },
  {
    icon: "browser",
    text: "JUEGOS EN HTML — CORREN EN CUALQUIER NAVEGADOR",
    accentColor: "cyan",
  },
  { icon: "plant", text: "PROYECTO EN CONSTANTE CRECIMIENTO", accentColor: "green" },
];

export const HOME_STATS: HomeStat[] = [
  { value: "12+", unit: "JUEGOS", caption: "Y CONTANDO" },
  { value: "MILES", unit: "DE PARTIDAS", caption: "JUGADAS CADA DÍA" },
  { value: "GLOBAL", unit: "RANKING", caption: "COMPITE CON EL MUNDO" },
];

export const RECENT_SCORES: RecentScore[] = [
  {
    playerName: "NEONFOX",
    gameId: "block-fall",
    score: 184220,
    timeAgoLabel: "hace 2 min",
    accentColor: "magenta",
  },
  {
    playerName: "PX_KAI",
    gameId: "glutton",
    score: 96400,
    timeAgoLabel: "hace 5 min",
    accentColor: "yellow",
  },
  {
    playerName: "Z3R0COOL",
    gameId: "invaders",
    score: 54190,
    timeAgoLabel: "hace 8 min",
    accentColor: "green",
  },
  {
    playerName: "VAULT_07",
    gameId: "rocks",
    score: 41200,
    timeAgoLabel: "hace 12 min",
    accentColor: "cyan",
  },
  {
    playerName: "GLITCHA",
    gameId: "brick-buster",
    score: 28450,
    timeAgoLabel: "hace 18 min",
    accentColor: "cyan",
  },
  {
    playerName: "ARKADYA",
    gameId: "serpentine",
    score: 7820,
    timeAgoLabel: "hace 24 min",
    accentColor: "green",
  },
  {
    playerName: "CYBER_LU",
    gameId: "frog-crossing",
    score: 18900,
    timeAgoLabel: "hace 31 min",
    accentColor: "yellow",
  },
];

export const TOP_PLAYERS_TODAY: TopPlayer[] = [
  { rank: 1, playerName: "NEONFOX", score: 312840 },
  { rank: 2, playerName: "PX_KAI", score: 248110 },
  { rank: 3, playerName: "M00NRYU", score: 196720 },
  { rank: 4, playerName: "VAULT_07", score: 154300 },
  { rank: 5, playerName: "GLITCHA", score: 138900 },
];

export const PRICING_INCLUDED_BENEFITS: string[] = [
  "Acceso a todos los juegos",
  "Ranking global y salón de la fama",
  "Sin anuncios entre partidas",
  "Guarda tus puntuaciones",
  "Nuevos juegos cada mes",
  "Funciona en cualquier navegador",
];

export const PRICING_FAQ: PricingFaqItem[] = [
  {
    question: "¿REALMENTE ES GRATIS?",
    answer:
      'Sí. Arcade Vault es un proyecto sin fines de lucro hecho por amor a los clásicos. No hay versión "premium" escondida.',
  },
  {
    question: "¿NECESITO CREAR CUENTA?",
    answer:
      "No. Puedes jugar como invitado. Si quieres guardar tu puntuación y aparecer en el ranking, regístrate en 10 segundos.",
  },
  {
    question: "¿CÓMO SOBREVIVEN SIN COBRAR?",
    answer:
      "Es un proyecto comunitario. Si te gusta, compártelo. Esa es toda la moneda que aceptamos.",
  },
];
