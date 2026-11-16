export type GameCategory = "ARCADE" | "PUZZLE" | "SHOOTER" | "VERSUS";
export type GameCategoryFilter = "TODOS" | GameCategory;
export type GameAccentColor = "cyan" | "magenta" | "green" | "yellow";

export type Game = {
  id: string;
  title: string;
  shortDescription: string;
  longDescription: string;
  category: GameCategory;
  coverClassName: string;
  accentColor: GameAccentColor;
  bestScore: number;
  playsLabel: string;
};

export const GAMES: Game[] = [
  {
    id: "brick-buster",
    title: "BRICK BUSTER",
    shortDescription: "Rebota la pelota y destruye muros de neón.",
    longDescription:
      "Pilota una nave-paleta y rebota un núcleo de plasma para pulverizar muros de bloques cromáticos. Cada nivel reorganiza la grilla en patrones imposibles. ¿Hasta dónde llegará tu racha?",
    category: "ARCADE",
    coverClassName: "cover-bricks",
    accentColor: "cyan",
    bestScore: 28450,
    playsLabel: "12.4K",
  },
  {
    id: "block-fall",
    title: "BLOCK FALL",
    shortDescription: "Encaja las piezas antes de que el techo te aplaste.",
    longDescription:
      "Piezas geométricas descienden desde la oscuridad. Rótalas, encástralas y limpia líneas para sobrevivir. La velocidad aumenta sin piedad cada 10 líneas.",
    category: "PUZZLE",
    coverClassName: "cover-tetro",
    accentColor: "magenta",
    bestScore: 184220,
    playsLabel: "31.8K",
  },
  {
    id: "serpentine",
    title: "SERPENTINE",
    shortDescription: "Crece sin morder tu propia cola.",
    longDescription:
      "Una serpiente de luz recorre la grilla buscando núcleos magenta. Cada bocado la alarga y la hace más veloz. Un movimiento en falso y se devora a sí misma.",
    category: "ARCADE",
    coverClassName: "cover-snake",
    accentColor: "green",
    bestScore: 7820,
    playsLabel: "9.1K",
  },
  {
    id: "glutton",
    title: "GLUTTON",
    shortDescription: "Devora puntos y escapa de los fantasmas.",
    longDescription:
      "Un círculo glotón patrulla un laberinto coleccionando puntos luminosos. Cuatro espectros lo persiguen, pero cada cierto tiempo aparece una píldora que invierte los papeles.",
    category: "ARCADE",
    coverClassName: "cover-glot",
    accentColor: "yellow",
    bestScore: 96400,
    playsLabel: "27.2K",
  },
  {
    id: "invaders",
    title: "INVADERS",
    shortDescription: "Defiende el planeta de filas alienígenas.",
    longDescription:
      "Olas de pixeles hostiles descienden formación tras formación. Mueve tu cañón en horizontal y abre fuego con precisión, antes de que toquen la superficie.",
    category: "SHOOTER",
    coverClassName: "cover-invaders",
    accentColor: "green",
    bestScore: 54190,
    playsLabel: "18.0K",
  },
  {
    id: "rocks",
    title: "ROCKS",
    shortDescription: "Pulveriza asteroides en gravedad cero.",
    longDescription:
      "Tu nave triangular flota en vacío absoluto. Dispara y rota para dividir rocas en fragmentos cada vez más pequeños. Cuidado con los OVNIs en el horizonte.",
    category: "SHOOTER",
    coverClassName: "cover-rocas",
    accentColor: "yellow",
    bestScore: 41200,
    playsLabel: "15.6K",
  },
  {
    id: "frog-crossing",
    title: "FROG CROSSING",
    shortDescription: "Cruza la autopista de pixeles.",
    longDescription:
      "Salta entre carriles de coches a toda velocidad y troncos a la deriva en el río. Llega a los nenúfares antes de que se acabe el tiempo.",
    category: "ARCADE",
    coverClassName: "cover-rana",
    accentColor: "green",
    bestScore: 18900,
    playsLabel: "6.4K",
  },
  {
    id: "pixel-duel",
    title: "PIXEL DUEL",
    shortDescription: "Dos paletas. Una pelota. Reflejos máximos.",
    longDescription:
      "El duelo más puro: dos paletas verticales se enfrentan por rebotar una pelota luminosa. Modo solitario contra la CPU o partida local a dos jugadores.",
    category: "VERSUS",
    coverClassName: "cover-duelo",
    accentColor: "cyan",
    bestScore: 24,
    playsLabel: "4.2K",
  },
];

export const CATEGORY_FILTERS: GameCategoryFilter[] = [
  "TODOS",
  "ARCADE",
  "PUZZLE",
  "SHOOTER",
  "VERSUS",
];

export function findGameById(id: string): Game | undefined {
  return GAMES.find((game) => game.id === id);
}
