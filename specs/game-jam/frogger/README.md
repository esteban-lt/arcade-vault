# Game jam: Frogger

- **Tema:** Frogger, el clásico de cruzar una carretera con tráfico y un río (troncos, tortugas) sin ser aplastado ni ahogarse, hasta llegar a las casillas de meta.
- **Fecha:** 2026-11-22

## Specs

| Archivo | Id | Título | Categoría | Acento | Concepto | Esfuerzo |
| --- | --- | --- | --- | --- | --- | --- |
| `01-river-hopper-game.md` | `river-hopper` | RIVER HOPPER | ARCADE | yellow | Versión completa del género: 4 carriles de tráfico, 5 de río con troncos y tortugas que se hunden, 5 casillas de meta, tiempo, mosca y niveles. | L |
| `02-leap-lane-game.md` | `leap-lane` | LEAP LANE | ARCADE | magenta | Carrera infinita: la pantalla avanza sola y genera carriles de hierba, carretera y río; una vida y puntuación por distancia y monedas. | M |
| `03-traffic-hop-game.md` | `traffic-hop` | TRAFFIC HOP | PUZZLE | cyan | Puzle por turnos: el mundo solo avanza cuando la rana salta o espera, y se premia el camino más corto calculado con una búsqueda en anchura. | M |

## Recomendada

**`01-river-hopper-game.md`.** Es la interpretación más fiel y reconocible del tema (tráfico, río con troncos y tortugas, casillas de meta), cabe en una spec, usa tres vidas y un tiempo por intento, y su puntuación es comparable. Las otras dos son alternativas más lejanas: LEAP LANE cambia la estructura a una carrera infinita y TRAFFIC HOP cambia el género a puzle.

Todas usan tarjeta nueva. El catálogo ya tiene la tarjeta simulada `frog-crossing` (FROG CROSSING); ninguna spec la toca ni la reutiliza.

## Cómo promover una

1. `git mv specs/game-jam/frogger/NN-<game-id>-game.md specs/NN-<game-id>-game.md`, con `NN` = siguiente número global (hoy, 10).
2. Cambiar `SPEC 0X` por `SPEC NN` en el título y poner `Status: Aprobado` (cambio humano).
3. Ejecutar `/spec-impl NN-<game-id>-game`.

Solo se promociona una spec: las demás se descartan o quedan como referencia.
