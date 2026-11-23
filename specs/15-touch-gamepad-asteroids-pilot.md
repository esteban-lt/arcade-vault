# SPEC 15 — Gamepad táctil y player móvil

> **Status:** Aprobado
> **Depends on:** SPEC 05, SPEC 07, SPEC 08, SPEC 09, SPEC 14
> **Date:** 2026-11-22
> **Objective:** Hacer jugables los 4 juegos con engine en móviles y pantallas táctiles con un gamepad compartido en pantalla (4 flechas + 1 botón de acción) y un player compacto que funcione en vertical y en horizontal.

---

## Por qué existe esta spec

Hoy todos los juegos se controlan solo con teclado (`KeyboardInput` escucha `keydown`/`keyup` en `window`); WALL BREAKER añade `mousemove` sobre el canvas, que tampoco existe en táctil. En un móvil no hay forma de mover la nave, la pieza, la pala ni la serpiente, y además el player está pensado para escritorio: barra de navegación y barra superior anchas, marco CRT con 24 px de relleno y pie de pantalla que le quitan espacio al canvas.

Auditoría previa (2026-11-22) de las teclas que usa cada engine y de lo que se asigna al gamepad:

| Juego | Teclas del engine | Gamepad |
| --- | --- | --- |
| ASTEROIDS | `ArrowLeft`/`ArrowRight` (giro, sostenido), `ArrowUp` (empuje, sostenido), `Space` (disparo, un evento por pulsación) | ← → ↑ + botón (disparo) |
| BLOCK STACK | `ArrowLeft`/`ArrowRight`/`ArrowDown` (con repetición), `ArrowUp` o `KeyX` (rotar), `Space` (caída rápida) | ← → ↓ ↑ (rotar) + botón (caída rápida) |
| WALL BREAKER | `ArrowLeft`/`ArrowRight` | ← → |
| FRUIT SNAKE | flechas y `WASD` | ← → ↑ ↓ (solo flechas) |

Ningún juego necesita más de **un** botón de acción (`KeyX` de BLOCK STACK duplica la rotación de `ArrowUp`), así que el gamepad tiene siempre 4 flechas + 1 botón y se muestra igual en todos; los controles que un juego no usa aparecen deshabilitados, de modo que la posición de los pulgares no cambia entre juegos.

La disposición se afinó con una prueba en un teléfono real: las flechas con caracteres de texto se veían de distinto tamaño, el botón de acción no necesita texto y, en horizontal, el límite del canvas es el alto de la pantalla, por lo que se oculta el navbar y se compacta la barra a una sola fila.

---

## Alcance

**Dentro:**

- `src/lib/games/touch-controls-registry.ts` (nuevo): qué juegos muestran el gamepad y qué tecla manda cada control. Entradas: `asteroids`, `block-stack`, `wall-breaker`, `fruit-snake`.
- `src/components/touch-gamepad.tsx` (nuevo): cruceta de 4 flechas a la izquierda y botón de acción a la derecha; traduce los toques en eventos de teclado sintéticos sobre `window`, así que los engines no cambian.
- `src/components/game-player.tsx`: envuelve CRT y gamepad en un contenedor de escenario, pasa el gamepad solo a los juegos del registro y lo deshabilita en pausa y en game over.
- `src/app/globals.css` (`@layer components`): estilos de `.touch-gamepad`, `.touch-dpad`, `.touch-action`, `.touch-btn`, y reglas compactas del player para pantallas pequeñas (barra superior, marco CRT, pie CRT, modal) y para horizontal (rejilla de tres columnas, navbar oculto, barra de una fila).
- Visibilidad del gamepad por CSS con `(pointer: coarse)`; el layout compacto por ancho/alto de pantalla.
- Layout vertical (canvas arriba, gamepad debajo) y horizontal (cruceta a la izquierda, canvas en el centro, botón a la derecha).
- Iconos de flecha SVG idénticos en tamaño y botón de acción sin texto visible.
- Evitar scroll, zoom por doble toque, selección de texto y menú contextual al tocar el gamepad o el canvas.
- Solo la ruta `/games/[id]/play`.

**Fuera de alcance (para otras specs):**

- Gestos (arrastrar la pala de WALL BREAKER, deslizar en FRUIT SNAKE) y controles táctiles directos sobre el canvas. El `mousemove` de WALL BREAKER no se toca.
- Gamepad en los juegos sin engine (simulación): no tienen controles que mapear.
- Mapear `WASD` o `KeyX` al gamepad (las flechas bastan).
- Auditoría responsive de las demás páginas (home, biblioteca, detalle, hall of fame, about, auth) y cambios en el navbar fuera del player.
- Vibración háptica, sonido, pantalla completa, bloqueo de orientación, auto-pausa al ocultar la pestaña.
- Autodisparo o disparo continuo al mantener el botón (ASTEROIDS sigue disparando una vez por pulsación).
- Cambios de jugabilidad, `GameEngine`, `GameCanvas`, puntuación, leaderboard, Supabase y skins.
- Pruebas automatizadas (el proyecto no tiene framework).

---

## Modelo de datos

```ts
// src/lib/games/touch-controls-registry.ts
export type TouchActionButton = { keyCode: string; label: string };

// A control mapped to null is rendered disabled.
export type TouchControlsConfig = {
  up: string | null;      // KeyboardEvent.code
  down: string | null;
  left: string | null;
  right: string | null;
  // label is only the accessible name (aria-label); the button shows no text.
  action: TouchActionButton | null;
};

// null = the game has no gamepad (it is not in the registry).
export function findTouchControls(gameId: string): TouchControlsConfig | null;
```

Entradas (guardadas en un `Map`, para que ids como `constructor` devuelvan `null`):

| Juego | up | down | left | right | action |
| --- | --- | --- | --- | --- | --- |
| `asteroids` | `ArrowUp` (empuje) | `null` | `ArrowLeft` | `ArrowRight` | `Space`, "DISPARO" |
| `block-stack` | `ArrowUp` (rotar) | `ArrowDown` | `ArrowLeft` | `ArrowRight` | `Space`, "CAÍDA RÁPIDA" |
| `wall-breaker` | `null` | `null` | `ArrowLeft` | `ArrowRight` | `null` |
| `fruit-snake` | `ArrowUp` | `ArrowDown` | `ArrowLeft` | `ArrowRight` | `null` |

```tsx
// src/components/touch-gamepad.tsx ("use client")
type TouchGamepadProps = {
  controls: TouchControlsConfig;
  // true while paused or on game over: buttons disabled and every held key released.
  isDisabled: boolean;
};
```

Contrato de entrada: al pulsar un botón se emite `new KeyboardEvent("keydown", { code })` en `window`, y al soltarlo `keyup`. Un botón no emite `keydown` repetidos mientras está pulsado. Cada botón usa Pointer Events con `setPointerCapture`, de modo que varios dedos actúan a la vez (multitouch) y soltar fuera del botón también libera la tecla. El estado "pulsado" para el estilo se marca con `data-pressed` desde un ref, no con `:active` (poco fiable en iOS).

Iconos: las cuatro flechas son el mismo `<svg>` de 24×24 px con un triángulo, rotado según la dirección (0°, −90°, 90°, 180°), de modo que miden exactamente lo mismo.

Estructura DOM del escenario (`GamePlayer`):

```
.player-stage
├── .crt                (canvas)
└── .touch-gamepad      (solo si findTouchControls(gameId) != null)
    ├── .touch-dpad     (↑ ← ↓ →)
    └── .touch-action   (botón de acción, sin texto)
```

Esta spec no introduce datos persistentes ni cambia el esquema de Supabase.

---

## Disposición de la interfaz

**Visibilidad.** El gamepad siempre está en el DOM para los juegos del registro y se oculta con `display: none` salvo bajo `@media (pointer: coarse)`. Al decidirse por CSS no hay desajuste de hidratación. En escritorio con ratón el player se ve como hoy.

**Vertical (por defecto en pantallas pequeñas):**

```
┌──────────────────────────────┐
│ JUGADOR  PUNT.  VIDAS  NIVEL │  barra compacta (máx. 2 filas)
│ [Skin ⌄] [PAUSA] [FIN] [SALIR]│
├──────────────────────────────┤
│                              │
│           CANVAS 4:3         │  ancho completo
│                              │
├──────────────────────────────┤
│     ▲                        │
│   ◀   ▶                 ( ● )│  pulgares
│     ▼                        │
└──────────────────────────────┘
```

**Horizontal en móvil** (`(pointer: coarse) and (orientation: landscape) and (max-height: 560px)`): el límite del canvas es el alto, no el ancho, así que se gana altura quitando elementos fijos:

- El navbar (`.av-nav`) se oculta solo en la página del player, con CSS (`body:has(.av-player) .av-nav`). El botón SALIR de la barra sigue llevando de vuelta.
- La barra superior pasa a una sola fila (`nowrap`): estadísticas a la izquierda y botones a la derecha.
- El escenario es una rejilla de tres columnas (`1fr auto 1fr`); `.touch-gamepad` pasa a `display: contents` para que `.touch-dpad` quede a la izquierda y `.touch-action` a la derecha del canvas.
- El canvas mantiene 4:3 y su ancho se calcula con el alto disponible: `(100dvh − --player-chrome) × 4/3 + 16px` (con respaldo `vh`). `--player-chrome` (~100 px) estima la barra, los márgenes y el marco CRT; se mide en el paso 7.

```
┌───────────────────────────────────────────────┐
│ JUGADOR PUNT. VIDAS NIVEL     [Skin][PAUSA][FIN][SALIR] │
├──────────┬─────────────────────────┬──────────┤
│   ▲      │                         │          │
│ ◀   ▶    │        CANVAS 4:3       │   ( ● )  │
│   ▼      │                         │          │
└──────────┴─────────────────────────┴──────────┘
```

**Compactación del player** (`max-width: 720px`, el mismo corte que ya usa `globals.css`, y también en horizontal bajo `max-height: 560px`): independiente de si el dispositivo es táctil, porque aplica a "pantallas más pequeñas":

- `.av-player`: margen vertical y relleno lateral reducidos (12 px).
- `.player-hud`: menos relleno; estadísticas en una sola fila con etiqueta de 8 px y valor de 12 px (clase `.hud-stats`); botones y `<select>` de skin más pequeños.
- `.crt`: relleno de unos 8 px, radio menor y un solo aro; `.crt-bottom` oculto.
- `.modal` (game over): relleno y tipografía menores, centrado con `margin: auto` (sin recortar la parte superior) y scroll interno si no cabe en 844×390.

**Botones del gamepad:** objetivo táctil mínimo de 56 px; la cruceta es una rejilla 3×3 de celdas de 64 px; el botón de acción es un círculo magenta de 112 px sin texto; estado pulsado visible (borde y brillo, cian en las flechas y magenta en el botón); estado `:disabled` atenuado y sin respuesta al toque. `touch-action: none`, `user-select: none`, `-webkit-touch-callout: none` y `-webkit-tap-highlight-color: transparent` en el gamepad y en `.game-canvas` (también en `.touch-dpad`, `.touch-action` y `.touch-btn`, porque `.touch-gamepad` es `display: contents` en horizontal); `contextmenu` cancelado en los botones.

---

## Plan de implementación

1. **Registro.** Crear `touch-controls-registry.ts` con los tipos, `findTouchControls` (sobre un `Map`) y las entradas de los 4 juegos. Nadie lo usa aún; la app sigue igual.
2. **Gamepad visual.** Crear `touch-gamepad.tsx` con iconos SVG y botón sin texto, y los estilos base en `globals.css`; `GamePlayer` envuelve `.crt` y el gamepad en `.player-stage` y lo muestra bajo el canvas. Visible solo con `(pointer: coarse)`; en escritorio no cambia nada.
3. **Teclas sintéticas.** Implementar los Pointer Events con captura, la emisión de `keydown`/`keyup` en `window` y la liberación de teclas al soltar, cancelar, perder la captura, hacer `blur` de la ventana, pausar, acabar la partida o desmontar. Los 4 juegos ya se pueden jugar con el gamepad.
4. **Player compacto.** Reglas de compactación de barra, marco CRT, pie y modal para `max-width: 720px` y horizontal bajo `max-height: 560px`.
5. **Horizontal.** Rejilla de tres columnas con gamepad a los lados, navbar oculto, barra de una fila y canvas ajustado al alto disponible bajo la media query horizontal táctil.
6. **Antiintrusión táctil.** `touch-action`, `user-select`, `-webkit-touch-callout`, `-webkit-tap-highlight-color` y `contextmenu` en gamepad y canvas.
7. **Ajustes de medida.** Medir con emulación de Chrome (390×844 y 844×390) y corregir `--player-chrome` y la barra en vertical hasta cumplir los criterios de layout.
8. **Cierre.** Marcar la spec como `Implementado` tras comprobar los criterios y anotar en las decisiones los ajustes que salgan de la prueba en el teléfono con cada juego.

---

## Criterios de aceptación

Salvo donde se indica "(manual)", se comprueban con emulación táctil de Chrome DevTools.

**Escritorio**

- [ ] Con ratón (`pointer: fine`) y ancho ≥ 1024 px, `/games/<id>/play` de los 4 juegos se ve igual que antes y `.touch-gamepad` no es visible.
- [ ] En escritorio, teclado y `P`/`Esc` siguen funcionando igual que antes.

**Gamepad (común)**

- [ ] Con emulación táctil, los 4 juegos con engine muestran la cruceta (↑ ← ↓ →) a la izquierda y un botón circular a la derecha; los juegos sin engine no muestran gamepad.
- [ ] Las cuatro flechas tienen exactamente el mismo tamaño visual (mismo `<svg>` de 24×24 px) y el botón de acción no muestra texto, solo `aria-label`.
- [ ] Los controles que el juego no usa (`null` en el registro) aparecen deshabilitados y no reaccionan.
- [ ] Cada control sostenido mantiene su tecla mientras se pulsa; un botón no repite `keydown` aunque se mantenga.
- [ ] Soltar el dedo (aunque sea fuera del botón), cancelar el toque o cambiar de pestaña libera la tecla: nada queda girando, empujando ni moviéndose.
- [ ] Al pulsar PAUSA, el gamepad queda deshabilitado y al REANUDAR no hay teclas pegadas; en el modal de game over el gamepad está deshabilitado y "JUGAR DE NUEVO" empieza con todo suelto.
- [ ] Tocar el gamepad o el canvas no hace scroll, no hace zoom con doble toque, no selecciona texto ni abre el menú contextual con pulsación larga.
- [ ] (manual) En el teléfono real se pueden mantener a la vez dos o tres controles sin que se pierda ningún toque.

**Por juego**

- [ ] ASTEROIDS: ← → giran la nave, ↑ empuja, ↓ está deshabilitado; cada pulsación del botón dispara una vez y mantenerlo no dispara en ráfaga.
- [ ] BLOCK STACK: ← → mueven la pieza y ↓ la baja con repetición mientras se mantiene; ↑ rota; el botón hace caída rápida.
- [ ] WALL BREAKER: ← → mueven la pala; ↑, ↓ y el botón están deshabilitados.
- [ ] FRUIT SNAKE: las 4 flechas cambian la dirección de la serpiente; el botón está deshabilitado.

**Layout vertical (390×844)**

- [ ] No hay scroll horizontal.
- [ ] Barra superior, canvas completo y gamepad completo se ven a la vez sin hacer scroll vertical (con el navbar visible).
- [ ] El canvas ocupa casi todo el ancho (ancho de pantalla menos el relleno lateral compacto) manteniendo 4:3.
- [ ] La barra superior no ocupa más de dos filas y el `<select>` de skin, PAUSA, FIN y SALIR son pulsables.

**Layout horizontal (844×390)**

- [ ] El navbar no se muestra en el player; en vertical y en escritorio sí.
- [ ] La barra superior ocupa una sola fila y no queda tapada por nada.
- [ ] Cruceta a la izquierda, canvas en el centro y botón a la derecha, sin scroll vertical de la página.
- [ ] El canvas mantiene 4:3 y no queda tapado por la barra ni por el gamepad.
- [ ] El modal de fin de partida se puede leer y sus botones se pueden pulsar (con scroll interno si hace falta).

**Calidad**

- [ ] Ningún engine ni `game-engine.ts` ni `game-canvas.tsx` cambian.
- [ ] `npx tsc --noEmit`, `npm run lint` y `npm run build` pasan sin errores.
- [ ] (manual) El usuario confirma en su teléfono, con los 4 juegos, que los pulgares llegan cómodos a los controles en vertical y en horizontal.

---

## Decisiones tomadas y descartadas

- **Sí (decisión del usuario):** un gamepad compartido con cruceta de 4 flechas a la izquierda y botón de acción a la derecha. **No:** gestos por juego ni controles distintos por juego.
- **Sí (decisión del usuario):** un solo botón de acción, siempre presente, que aparece deshabilitado si el juego no lo necesita, y la cruceta completa con los controles no usados deshabilitados. Motivo: los 4 juegos usan como máximo un botón, y así la posición de los pulgares no cambia entre juegos. **No:** mostrar solo lo que usa cada juego.
- **Sí (decisión del usuario):** los 4 juegos con engine en esta misma spec, probando primero la infraestructura con ASTEROIDS, el más exigente por el multitouch. **No:** dejar los demás para una spec posterior.
- **Sí (decisión del usuario):** alcance solo `/games/[id]/play`; barra superior compacta, canvas lo más grande posible y controles debajo, a la altura de los pulgares. **No:** auditar las demás páginas.
- **Sí (decisión del usuario):** vertical y horizontal sin forzar orientación; en horizontal el gamepad va a los lados del canvas. **No:** aviso de girar el dispositivo, pantalla completa ni bloqueo de orientación (no funciona en iOS Safari y añade riesgo); **no:** gamepad encima del canvas.
- **Sí (decisión del usuario, tras probar en el teléfono):** iconos de flecha SVG iguales en tamaño. **No:** caracteres `▲ ◀ ▶ ▼`: la fuente los dibuja con tamaños distintos.
- **Sí (decisión del usuario, tras probar en el teléfono):** botón de acción genérico, sin texto visible; la etiqueta del registro queda como `aria-label`. **No:** texto "DISPARO" en el botón.
- **Sí (decisión del usuario, tras probar en el teléfono):** en horizontal, ocultar el navbar en el player y dejar la barra superior en una sola fila para agrandar el canvas. Motivo: el límite del canvas es el alto; el navbar ocupaba unos 65 px de 390. **No:** poner los controles sobre el canvas (no lo agranda, porque los laterales ya estaban vacíos, y taparía el juego); **no:** contenedor al 90 % del alto con scroll (choca con `touch-action: none` en canvas y gamepad y no ayuda en vertical, donde el canvas ya ocupa todo el ancho).
- **Sí (decisión del usuario):** gamepad visible solo en pantallas táctiles (`(pointer: coarse)`). La compactación del player depende del tamaño de pantalla, no del tipo de puntero. **No:** mostrar el gamepad por ancho (se vería en ventanas pequeñas de escritorio) ni preferencia de ocultar en `localStorage`.
- **Sí:** teclas sintéticas sobre `window` con `KeyboardEvent` y `code`. Los 4 engines ya escuchan ahí, así que el contrato `GameEngine` y `GameCanvas` no cambian, y BLOCK STACK (con `HeldKeyRepeater`) funciona sin tocar su lógica. **No:** un método `press`/`release` en `KeyboardInput` expuesto por el canvas (obligaría a pasar el engine al gamepad y a cambiar el contrato).
- **Sí:** solo flechas en el gamepad: FRUIT SNAKE acepta también `WASD` y BLOCK STACK `KeyX`, pero son alias. **No:** mapearlos.
- **Sí:** WALL BREAKER conserva su `mousemove` y añade el gamepad; arrastrar la pala queda para otra spec. **No:** reescribir `CanvasPointerInput` aquí.
- **Sí:** Pointer Events con `setPointerCapture`, que cubren táctil, lápiz y ratón y permiten multitouch. **No:** `touchstart`/`touchend` (no capturan y obligan a duplicar lógica con el ratón).
- **Sí:** visibilidad por CSS, sin leer `matchMedia` en el cliente, para mantener estable la hidratación. **No:** estado de React para "es táctil".
- **Sí:** estado pulsado con `data-pressed` escrito desde un ref. **No:** `:active` (poco fiable en iOS) ni estado de React.
- **Sí:** registro sobre un `Map`. **No:** un objeto indexado por id (`constructor` devolvería una función del prototipo).
- **Sí:** no modificar `viewport` en `layout.tsx` (sin `viewportFit: "cover"` ni `maximumScale`): `touch-action: none` en el gamepad evita el zoom accidental sin quitarlo a las demás páginas y sin que el contenido de otras rutas invada el notch en horizontal.
- **Sí:** el botón de pausa de la barra sigue siendo el único modo táctil de pausar (`P`/`Esc` no existen en móvil). **No:** botón de pausa propio en el gamepad.
- **Sí:** el disparo de ASTEROIDS se mantiene como evento por pulsación. **No:** autodisparo (cambia jugabilidad; si se quiere, va en otra spec).

---

## Riesgos identificados

| Riesgo | Mitigación |
| --- | --- |
| Teclas pegadas si el sistema cancela el toque (llamada, gesto del sistema, cambio de app). | Liberar en `pointerup`, `pointercancel`, `lostpointercapture`, `blur` de la ventana, pausa, game over y desmontaje. |
| Safari iOS cancela `touch-action` o abre el menú contextual con pulsación larga. | `touch-action: none`, `-webkit-touch-callout: none`, `user-select: none` y `contextmenu` cancelado; se confirma en el teléfono. |
| La emulación de DevTools no reproduce multitouch real ni la ergonomía. | Criterios (manual) con el teléfono del usuario; los ajustes que salgan se anotan en esta spec. |
| `--player-chrome` es una estimación y el alto real de la barra varía con la fuente y el idioma. | Medirlo en el paso 7 con 844×390 y ajustarlo; si hay scroll vertical en horizontal, el criterio falla. |
| `100dvh` y la barra del navegador móvil cambian el alto disponible. | Usar `dvh` con respaldo en `vh` y comprobar que el player no provoca scroll en horizontal. |
| Sin navbar en horizontal no hay acceso al menú ni al perfil desde el player. | SALIR lleva a la página del juego, donde el navbar sí aparece; en vertical el navbar se mantiene. |
| FRUIT SNAKE con toques rápidos en flechas opuestas puede invertir la serpiente. | Lo resuelve la lógica del engine (no se cambia aquí); se confirma en el teléfono. |
| El `<select>` de skin queda enfocado y capta las flechas del teclado en táctil con teclado. | Ya se hace `blur()` al elegir (SPEC 14); el gamepad emite eventos en `window`, no depende del foco. |
| La compactación a `max-width: 720px` afecta a los 4 juegos y a escritorios estrechos. | Es solo layout; se comprueba en los criterios de cada juego y se ve igual por encima de 720 px. |
| Teclado y gamepad a la vez (portátil táctil) pueden duplicar una tecla sostenida. | Cada origen emite su propio `keydown`; `KeyboardInput` trata la tecla como sostenida hasta el primer `keyup`, comportamiento aceptado. |

---

## Qué **no** entra en esta spec

- Gamepad en los juegos sin engine.
- Arrastre de la pala, deslizamiento de la serpiente u otros gestos.
- `WASD` y `KeyX` en el gamepad.
- Responsive del resto de páginas y cambios del navbar fuera del player.
- Vibración, sonido, pantalla completa, bloqueo de orientación y auto-pausa al ocultar la pestaña.
- Disparo continuo o cambios de jugabilidad.
- Pruebas automatizadas.

Cada uno de estos puntos, si se aborda, va en su propia spec.
