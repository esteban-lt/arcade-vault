"use client";

import { useState } from "react";
import { GameCard } from "@/components/game-card";
import { CATEGORY_FILTERS, GAMES, type GameCategoryFilter } from "@/lib/games";

export function Library() {
  const [searchText, setSearchText] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<GameCategoryFilter>("TODOS");

  const normalizedSearchText = searchText.toLowerCase();
  const visibleGames = GAMES.filter(
    (game) =>
      (selectedCategory === "TODOS" || game.category === selectedCategory) &&
      game.title.toLowerCase().includes(normalizedSearchText),
  );

  return (
    <div className="fade-in">
      <section className="av-hero">
        <h1 className="flicker">ARCADE VAULT</h1>
        <div className="sub">
          INSERTA UNA MONEDA PARA JUGAR <span className="blink">_</span>
        </div>
      </section>

      <div className="av-filters">
        <div className="av-search">
          <span className="ico">⌕</span>
          <input
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            placeholder="Buscar un juego por nombre…"
            aria-label="Buscar un juego por nombre"
          />
        </div>
        <div className="av-chips">
          {CATEGORY_FILTERS.map((category) => (
            <button
              key={category}
              type="button"
              className={"chip" + (selectedCategory === category ? " active" : "")}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      <div className="av-grid">
        {visibleGames.map((game) => (
          <GameCard key={game.id} game={game} />
        ))}
        {visibleGames.length === 0 && (
          <div
            style={{
              gridColumn: "1 / -1",
              textAlign: "center",
              padding: 80,
              color: "var(--ink-faint)",
            }}
          >
            <div className="pixel" style={{ fontSize: 14, color: "var(--magenta)", marginBottom: 12 }}>
              NO HAY RESULTADOS
            </div>
            <div>Intenta otra búsqueda o categoría.</div>
          </div>
        )}
      </div>
    </div>
  );
}
