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
  },
  {
    id: "asteroids",
    title: "ASTEROIDS",
    shortDescription: "Sobrevive a la lluvia de rocas en el vacío.",
    longDescription:
      "Pilota una nave con inercia por un campo de asteroides que se parten en fragmentos cada vez más rápidos. Recoge el disparo triple, limpia cada oleada y aguanta con tus tres vidas.",
    category: "SHOOTER",
    coverClassName: "cover-asteroids",
    accentColor: "cyan",
  },
  {
    id: "block-stack",
    title: "BLOCK STACK",
    shortDescription: "Gira y encaja bloques que caen para limpiar líneas.",
    longDescription:
      "Siete piezas de cuatro bloques caen sobre un pozo de 10×20. Muévelas, gíralas o suéltalas de golpe para completar filas, guiado por la sombra que marca dónde aterrizarán. Cada 10 líneas sube el nivel y la caída se acelera.",
    category: "PUZZLE",
    coverClassName: "cover-block-stack",
    accentColor: "yellow",
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
