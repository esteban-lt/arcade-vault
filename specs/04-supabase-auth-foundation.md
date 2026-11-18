# SPEC 04 — Cimientos de Supabase y autenticación real

> **Status:** Aprobado
> **Depends on:** SPEC 01, SPEC 02
> **Date:** 2026-11-17
> **Objective:** Conectar la app a Supabase con `@supabase/ssr` y reemplazar la sesión simulada en localStorage por autenticación real con correo y contraseña, con un perfil de jugador (`profiles`) de username único.

---

## Por qué existe esta spec

Hoy `/auth` es una simulación: `AuthProvider` guarda `{ name }` en localStorage (`lib/session.ts`) y no valida nada. El proyecto de Supabase ya existe y está vacío (sin tablas), y el MCP y las skills de Supabase ya están configurados. "Implementar Supabase" cubre varias áreas (auth, puntuaciones, mensajes de contacto, datos de la Home); esta spec toma solo los **cimientos y la autenticación**, para que las siguientes (puntuaciones reales, Salón de la Fama, contacto) tengan una base de usuarios y de cliente ya probada.

---

## Alcance

**Dentro:**

- Dependencias `@supabase/supabase-js` y `@supabase/ssr` en `package.json`.
- Variables de entorno públicas (la clave publicable está pensada para el navegador), definidas en `.env` y listadas en `.env.example`:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (formato `sb_publishable_...`; nunca la `service_role` ni la secret key).
- Clientes de Supabase en `src/lib/supabase/`: uno para el navegador (`client.ts`), uno para el servidor (`server.ts`, con cookies) y el helper de refresco de sesión para el proxy (`proxy.ts`).
- Ampliar `src/proxy.ts` para que, además de comprobar los ids de juego, refresque la sesión de Supabase (cookies) en las rutas de la app. Las reglas actuales de 404 para `/games/:id` y `/games/:id/play` se conservan intactas.
- Base de datos (migración aplicada con el MCP de Supabase y guardada en `supabase/migrations/`):
  - Tabla `public.profiles` con `username` único sin distinguir mayúsculas, de 3 a 20 caracteres, solo letras, números y `_`.
  - Trigger sobre `auth.users` que crea la fila de `profiles` al registrarse, tomando el username de `raw_user_meta_data`.
  - RLS activado en `profiles`: lectura pública (el ranking futuro necesita ver nombres) y actualización solo del propio perfil.
- Autenticación en `/auth` con correo y contraseña:
  - "INICIAR SESIÓN": campos Correo y Contraseña (el campo Usuario deja de pedirse aquí).
  - "CREAR CUENTA": Usuario, Correo y Contraseña; `signUp` con el username en los metadatos.
  - Estados de la UI: normal → enviando (botón deshabilitado) → éxito (redirige a `/games`) o error (mensaje visible sobre el botón, campos intactos).
  - Validación en cliente y servidor del username (3–20, `[A-Za-z0-9_]`) y mensaje claro si el username ya existe.
  - "JUGAR COMO INVITADO" se mantiene: cierra cualquier sesión y va a `/games`.
- `AuthProvider` pasa a leer la sesión de Supabase (`getUser` al montar y `onAuthStateChange`), conservando la API `useAuth()` (`user`, `signOut`) para que Nav, Reproductor y Salón casi no cambien. `signIn` deja de existir: el inicio de sesión lo hace el formulario con Supabase y el provider reacciona al evento.
- El nombre de jugador que muestra la UI es el `username` de `profiles` en mayúsculas (`toUpperCase()`); el invitado sigue siendo `PLAYER1`/`GUEST` según el comportamiento actual del Reproductor.
- Eliminar `src/lib/session.ts` (la sesión en localStorage deja de existir).
- Desactivar "Confirm email" en el panel de Supabase para desarrollo (paso manual del usuario).
- Texto de la UI en español; rutas, código, nombres y comentarios en inglés, con nombres descriptivos y sin abreviaturas.

**Fuera de alcance (para otras specs):**

- Guardar y leer puntuaciones en Supabase; `src/lib/score-storage.ts` queda intacto (sigue en localStorage) y no se migra ninguna puntuación.
- Salón de la Fama y Home con datos reales.
- Guardar los mensajes del formulario de contacto en la base de datos.
- Inicio de sesión con Google y GitHub (los botones siguen sin función) y magic link.
- Confirmación de correo, recuperación y cambio de contraseña, cambio de username, borrado de cuenta.
- Proteger rutas (redirigir a `/auth` si no hay sesión) y roles o permisos.
- Avatares, Storage, Realtime, Edge Functions.
- Generar tipos con `generate_typescript_types` (los tipos de `profiles` se escriben a mano en esta spec).
- Pruebas automatizadas.

---

## Modelo de datos

```sql
-- supabase/migrations/<timestamp>_create_profiles.sql
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null,
  created_at timestamptz not null default now(),
  constraint profiles_username_format
    check (username ~ '^[A-Za-z0-9_]{3,20}$')
);

-- Unique without regard to case: "Neon_Fox" and "neon_fox" collide.
create unique index profiles_username_lower_key
  on public.profiles (lower(username));

alter table public.profiles enable row level security;

create policy "profiles are readable by everyone"
  on public.profiles for select using (true);

create policy "users update their own profile"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- Creates the profile when a user signs up (security definer, fixed search_path).
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, username)
  values (new.id, new.raw_user_meta_data ->> 'username');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

```ts
// src/lib/profile.ts
export const USERNAME_LIMITS = { minLength: 3, maxLength: 20 } as const;
export const USERNAME_PATTERN = /^[A-Za-z0-9_]{3,20}$/;

export type Profile = {
  id: string;
  username: string;
  createdAt: string;
};

export type SessionUser = {
  id: string;
  name: string; // profile username in uppercase, e.g. "NEON_FOX"
};
```

Convenciones:

- El username se guarda tal como lo escribe el usuario; la unicidad es por `lower(username)` y la UI lo muestra con `toUpperCase()`.
- `SessionUser` vive en `lib/profile.ts` (reemplaza al de `lib/session.ts`) y mantiene `name`, así que los consumidores actuales de `useAuth().user.name` no cambian.
- No hay `insert` ni `delete` público sobre `profiles`: solo el trigger crea filas y el borrado cae en cascada desde `auth.users`.
- Variables `NEXT_PUBLIC_*` solo con valores publicables; ninguna clave secreta entra al código ni al repositorio.

---

## Plan de implementación

Antes de empezar: cargar la skill `supabase` y `supabase-postgres-best-practices`; releer en `node_modules/next/dist/docs/01-app/` las guías de `proxy` (antes `middleware`), cookies y Cache Components, y revisar si `cacheComponents: true` afecta a leer cookies en un cliente de servidor. Obtener la URL y la clave publicable con `get_project_url` y `get_publishable_keys` del MCP.

1. **Dependencias y entorno.** `npm install @supabase/supabase-js @supabase/ssr`; añadir las dos variables a `.env` (valores reales del MCP) y a `.env.example` (valores de ejemplo sin datos reales). Verificación: `npm run build` pasa; `git check-ignore .env` lo confirma y `.env.example` aparece como modificado.
2. **Base de datos.** Aplicar la migración con `apply_migration` y guardar el mismo SQL en `supabase/migrations/`. Revisar `get_advisors` (seguridad). Verificación: `list_tables` muestra `profiles` con RLS activado y los advisors no reportan `profiles` sin RLS ni la función con `search_path` mutable.
3. **Clientes de Supabase.** Crear `src/lib/supabase/client.ts`, `server.ts` y `proxy.ts` (refresco de sesión) con `@supabase/ssr` y las variables anteriores. Verificación: `npx tsc --noEmit` y `npm run lint` pasan.
4. **Proxy.** Ampliar `src/proxy.ts`: ejecutar el refresco de sesión y conservar la lógica de 404 de juegos; ampliar el `matcher` a las rutas de la app, excluyendo estáticos (`_next/static`, `_next/image`, `favicon.ico`, imágenes). Verificación: `/games/no-existe` sigue devolviendo 404 y `/games/block-fall` carga.
5. **Perfil y validación.** Crear `src/lib/profile.ts` con límites, patrón y tipos. Verificación: `npx tsc --noEmit` pasa.
6. **AuthProvider.** Reescribir `components/auth-provider.tsx` con el cliente de navegador: estado inicial invitado, `getUser` + consulta del username en `profiles` tras montar, suscripción a `onAuthStateChange`, `signOut` que llama a `supabase.auth.signOut()`. Eliminar `src/lib/session.ts`. Verificación: la app compila y sin sesión todo se ve como invitado.
7. **Formulario de `/auth`.** Reescribir `components/auth-form.tsx`: login con correo y contraseña, registro con username/correo/contraseña (`signUp` con `options.data.username`), estados enviando/error, validación del username, mensajes en español para credenciales inválidas, correo ya registrado y username ya usado; redirigir a `/games` al terminar. Verificación: el flujo completo de acceso funciona en el navegador.
8. **Revisión de consumidores.** Ajustar `components/nav.tsx`, `game-player.tsx` y `hall-of-fame.tsx` solo si el cambio de `useAuth()` lo exige. Ejecutar `npm run lint`, `npx tsc --noEmit` y `npm run build`.

---

## Criterios de aceptación

- [ ] `npm run lint`, `npx tsc --noEmit` y `npm run build` terminan sin errores.
- [ ] `list_tables` del MCP muestra `public.profiles` con RLS activado, y `get_advisors` no reporta problemas de seguridad sobre ella ni sobre `handle_new_user`.
- [ ] `supabase/migrations/` contiene el SQL de la migración aplicada.
- [ ] Crear una cuenta con username `neon_fox`, correo y contraseña válidos crea el usuario en `auth.users` y una fila en `profiles` con ese username, e inicia sesión y redirige a `/games`.
- [ ] El Nav muestra `NEON_FOX` (mayúsculas) tras el registro y tras recargar la página (la sesión persiste en cookies).
- [ ] Registrar `NEON_FOX` o `Neon_Fox` con otro correo falla con un mensaje claro de username ya usado y no crea ningún usuario nuevo.
- [ ] Un username de 2 o de 21 caracteres, o con espacios o símbolos, es rechazado con un mensaje claro; uno de 20 caracteres es aceptado.
- [ ] Iniciar sesión con correo y contraseña correctos funciona; con una contraseña incorrecta se muestra un error en español, se conservan los campos y se puede reintentar.
- [ ] "Cerrar sesión" (Nav, escritorio y panel móvil) cierra la sesión de Supabase y la app vuelve a mostrar el estado de invitado, incluso tras recargar.
- [ ] "JUGAR COMO INVITADO" cierra cualquier sesión activa y lleva a `/games`.
- [ ] En el Reproductor, un usuario con sesión juega con su username en mayúsculas y un invitado conserva el comportamiento actual; `saveScore` sigue escribiendo en localStorage.
- [ ] Con una sesión iniciada, desde el cliente de la clave publicable no se puede actualizar el `profiles` de otro usuario (RLS lo rechaza) ni insertar ni borrar filas.
- [ ] `src/lib/session.ts` no existe y `grep` no encuentra `arcade-vault:user` ni `readStoredSessionUser` en `src/`.
- [ ] `/games/no-existe` devuelve estado 404 y `/games/block-fall` y `/games/block-fall/play` cargan con sesión y sin ella.
- [ ] Ninguna clave secreta (`service_role` o secret key) aparece en el repositorio, en `.next/static` ni en `.env.example`; `.env` no aparece en `git status`.
- [ ] Recargar `/`, `/games` y `/auth` con y sin sesión no produce advertencias de hidratación en la consola.
- [ ] Ninguna otra pantalla cambia visualmente.

---

## Decisiones tomadas y descartadas

- **Sí:** esta spec cubre solo cimientos y autenticación. Decisión del usuario. **No:** puntuaciones, Salón de la Fama, contacto y Home con datos reales: "implementar Supabase" toca más de tres áreas y cada una merece su propia spec.
- **Sí:** correo y contraseña, más "Jugar como invitado". Decisión del usuario. **No:** Google y GitHub (requieren apps OAuth externas) ni magic link; los botones sociales se quedan sin función como hoy.
- **Sí:** iniciar sesión con **correo** + contraseña. Decisión del usuario; es lo nativo de Supabase Auth. **No:** iniciar con username, que obligaría a una función SQL que resuelva el correo y expondría qué usernames existen.
- **Sí:** sin confirmación de correo en desarrollo ("Confirm email" desactivado en el panel). Decisión del usuario; mantiene el registro directo de hoy. **No:** el flujo de enlace y ruta de callback, que se aborda al salir a producción.
- **Sí:** tabla `profiles` con username único. Decisión del usuario; permite ranking y unicidad. **No:** `user_metadata`, que no se puede consultar ni garantizar único.
- **Sí:** username de **3 a 20** caracteres, en lugar de los 10 de la plantilla. Decisión del usuario: 10 le parecen muy pocos. Reemplaza `MAXIMUM_PLAYER_NAME_LENGTH = 10` de `auth-form.tsx`.
- **Sí:** letras, números y `_`, único sin distinguir mayúsculas, mostrado en mayúsculas. **No:** cualquier carácter imprimible, que admite espacios y símbolos problemáticos para ranking y URLs.
- **Sí:** perfil creado por trigger de base de datos (`security definer`, `search_path` vacío). Es atómico con el registro, y el cliente no necesita permiso de `insert` en `profiles`. **No:** insertar desde el cliente tras `signUp`, que puede dejar usuarios sin perfil si falla.
- **Sí:** el proxy refresca la sesión y el `AuthProvider` cliente mantiene la API `useAuth()`. Decisión del usuario; Nav, Reproductor y Salón casi no cambian. **No:** leer el usuario en el servidor y pasarlo por props, que toca layout y páginas y choca con `cacheComponents`.
- **Sí:** eliminar `lib/session.ts` y dejar `score-storage.ts` intacto hasta la spec de puntuaciones. Decisión del usuario. **No:** migrar puntuaciones de localStorage a Supabase aquí.
- **Sí:** clave publicable (`sb_publishable_...`) en `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`; la seguridad la dan las políticas RLS. **No:** `service_role` ni la secret key en el cliente ni en el repositorio.
- **Sí:** migración guardada como archivo en `supabase/migrations/` además de aplicarla con el MCP, para que el esquema quede versionado en git. **No:** cambios hechos solo en el panel o por MCP, sin rastro en el repositorio.
- **Sí:** tipos de `profiles` escritos a mano en esta spec. **No:** `generate_typescript_types`, que tiene más sentido cuando haya varias tablas.

---

## Riesgos identificados

| Riesgo | Mitigación |
| --- | --- |
| "Confirm email" sigue activo en el panel y el registro no inicia sesión | Paso manual explícito en el plan; el criterio de registro lo verifica de punta a punta. |
| `proxy.ts` con matcher amplio ralentiza o rompe estáticos | Excluir `_next/static`, `_next/image`, favicon e imágenes del matcher; verificar que las rutas de juegos siguen devolviendo 404/200 correctos. |
| `cacheComponents` o el modelo de renderizado de Next 16 cambian cómo se leen las cookies en el servidor | Leer las guías de `node_modules/next/dist/docs/` antes de escribir los clientes (inicio del plan). |
| El trigger falla (username nulo o inválido) y bloquea el alta | La restricción `CHECK` rechaza el alta con error; el formulario valida antes y mapea el error de username duplicado/ inválido a un mensaje claro. |
| Un `username` ocupado solo se detecta al insertar (condición de carrera) | La unicidad la garantiza el índice, no el cliente; el formulario interpreta el error del alta como "username ya usado". |
| Parpadeo de estado invitado al cargar (el provider lee la sesión tras montar) | Mismo patrón actual: se parte como invitado para igualar el render servidor/cliente y se actualiza tras montar; sin advertencias de hidratación. |
| Fuga de claves al repositorio | Solo se usa la clave publicable; criterio de aceptación que revisa el repositorio y `.next/static`. |
| El MCP apunta a un proyecto remoto real: migraciones erróneas afectan datos | El proyecto está vacío; revisar el SQL y `get_advisors` antes y después de aplicar la migración. |

---

## Qué **no** entra en esta spec

- Puntuaciones en Supabase, Salón de la Fama y Home con datos reales.
- Mensajes de contacto en base de datos.
- Google, GitHub y magic link.
- Confirmación de correo, recuperación o cambio de contraseña, cambio de username, borrado de cuenta.
- Rutas protegidas, roles y permisos.
- Storage, Realtime, Edge Functions y tipos generados.
- Pruebas automatizadas.

Cada uno de estos puntos, si se aborda, va en su propia spec.
