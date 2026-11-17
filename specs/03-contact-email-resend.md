# SPEC 03 — Envío real del formulario de contacto con Resend

> **Status:** Aprobado
> **Depends on:** SPEC 02
> **Date:** 2026-11-16
> **Objective:** Reemplazar el envío simulado del formulario de `/about` por una Server Action que valida los datos en el servidor y envía el mensaje por correo con Resend.

---

## Por qué existe esta spec

La SPEC 02 dejó el formulario de contacto como una simulación: valida que haya texto, muestra la terminal de éxito y no envía nada (el envío real quedó fuera de alcance). Esta spec cierra ese hueco. Como el formulario pasa a tener efectos reales, aparecen tres necesidades que antes no existían: proteger la clave de Resend (solo en el servidor), revalidar en el servidor (una Server Action se puede invocar con un POST directo) y mostrar un estado de error cuando el envío falla.

---

## Alcance

**Dentro:**

- Dependencia `resend` (SDK oficial) en `package.json`.
- Server Action `sendContactMessage` en `app/about/actions.ts` (`"use server"`), invocada desde `components/about-page.tsx`.
- Un solo correo por envío, dirigido al equipo (`CONTACT_TO_EMAIL`), con el nombre, el correo y el mensaje del visitante. El `replyTo` es el correo del visitante, para responder directamente desde el buzón.
- Variables de entorno, leídas solo en el servidor y definidas en `.env` (ignorado por git):
  - `RESEND_API_KEY`
  - `CONTACT_TO_EMAIL` — buzón que recibe los mensajes.
  - `CONTACT_FROM_EMAIL` — remitente, con formato `Arcade Vault <onboarding@resend.dev>` para pruebas.
- `.env.example` en la raíz, versionado, con las tres variables y valores de ejemplo sin datos reales (`RESEND_API_KEY=re_xxxxxxxxxxxx`, `CONTACT_TO_EMAIL=tu-correo@ejemplo.com`, `CONTACT_FROM_EMAIL="Arcade Vault <onboarding@resend.dev>"`).
- Ajuste de `.gitignore`: el patrón `.env*` también ignora `.env.example`, así que se añade la excepción `!.env.example` justo debajo de `.env*`.
- Validación en el servidor (`lib/contact.ts`): los tres campos no vacíos tras `trim()`, formato de correo válido y límites de longitud (nombre 80, correo 254, mensaje 2000 caracteres).
- Campo trampa anti-bots (honeypot): un input oculto `website`; si llega con texto, la acción responde éxito sin enviar nada.
- Estados de la UI en el formulario: normal → enviando (botón deshabilitado con texto "ENVIANDO…") → éxito (la terminal actual) o error (mensaje visible sobre el botón, con los campos intactos para reintentar).
- Texto de la UI en español; rutas, código, nombres y comentarios en inglés, con nombres descriptivos y sin abreviaturas.

**Fuera de alcance (para otras specs):**

- Dominio propio verificado en Resend y remitente personalizado (solo requiere cambiar `CONTACT_FROM_EMAIL`, sin tocar código).
- Correo de confirmación al visitante.
- Límite de envíos por IP (rate limiting) o captcha.
- Persistir los mensajes en base de datos o mostrarlos en alguna pantalla.
- Plantillas HTML o React Email: el correo es texto plano.
- Adjuntos, reintentos automáticos o cola de envíos.
- Pruebas automatizadas.
- Cambios en el diseño de `/about` más allá del mensaje de error y el estado "enviando".

---

## Modelo de datos

```ts
// lib/contact.ts
export const CONTACT_LIMITS = {
  nameMaxLength: 80,
  emailMaxLength: 254,
  messageMaxLength: 2000,
} as const;

export type ContactMessageInput = {
  name: string;
  email: string;
  message: string;
  website: string; // honeypot, always "" for real visitors
};

export type ContactFieldName = "name" | "email" | "message";

export type SendContactMessageResult =
  | { status: "success"; senderName: string }
  | { status: "invalid"; invalidFields: ContactFieldName[] }
  | { status: "failed" }; // Resend rejected the email or the server is misconfigured

export function validateContactMessage(input: ContactMessageInput): ContactFieldName[];
```

Convenciones:

- `validateContactMessage` devuelve la lista de campos inválidos (vacía si todo es válido); la usan el servidor (obligatorio) y el cliente (para sacudir el formulario sin ir al servidor).
- El resultado de la acción es una unión discriminada por `status`; nunca lanza excepciones al cliente.
- Los detalles del error de Resend se registran con `console.error` en el servidor y no se envían al cliente.
- Variables de entorno: sin prefijo `NEXT_PUBLIC_`, para que nunca lleguen al bundle del navegador.

---

## Plan de implementación

Antes de empezar: releer en `node_modules/next/dist/docs/01-app/01-getting-started/` la guía `07-mutating-data.md` y `node_modules/next/dist/docs/01-app/02-guides/` la de Server Actions, y revisar si `cacheComponents: true` afecta a las acciones o a la página `/about`.

1. **Dependencia y entorno.** Instalar `resend` con `npm install resend`; añadir `!.env.example` a `.gitignore` debajo de `.env*`; crear `.env.example` con las tres variables y valores de ejemplo; crear `.env` con los valores reales (la clave y los correos los pone el usuario). Verificación: `npm run build` pasa, `git status` muestra `.env.example` como archivo nuevo y no muestra `.env` (`git check-ignore .env` lo confirma).
2. **Validación compartida.** Crear `lib/contact.ts` con `CONTACT_LIMITS`, los tipos y `validateContactMessage`. Verificación: `npx tsc --noEmit` y `npm run lint` pasan.
3. **Server Action.** Crear `app/about/actions.ts` con `sendContactMessage(input)`: honeypot, validación, lectura de variables (si falta alguna → `failed`), envío con `resend.emails.send` (`from`, `to`, `replyTo`, `subject`, `text`) y mapeo del `error` de Resend a `failed`. El asunto es `[Arcade Vault] Mensaje de <nombre>` con saltos de línea eliminados del nombre. Verificación: `npm run build` pasa y la clave no aparece en `.next/static`.
4. **Conectar el formulario.** En `components/about-page.tsx`, reemplazar el éxito simulado por la llamada a la acción dentro de `useTransition`: añadir el input honeypot oculto, el estado "enviando", la sacudida para `invalid` y el mensaje de error para `failed`. Mantener la terminal de éxito y "ENVIAR OTRO MENSAJE". Verificación: con datos válidos llega el correo al buzón de `CONTACT_TO_EMAIL`.
5. **Estilos del error.** Portar a `app/globals.css` la clase del mensaje de error del formulario (y el estilo deshabilitado del botón si falta), siguiendo el tema neón existente. Verificación: con una clave inválida el error se ve bien en escritorio y en ≤ 480 px.

---

## Criterios de aceptación

- [ ] `npm run lint`, `npx tsc --noEmit` y `npm run build` terminan sin errores.
- [ ] Enviar `/about` con algún campo vacío o con un correo mal formado sacude el formulario y no realiza ninguna petición de red.
- [ ] Con los tres campos válidos y las variables bien configuradas, llega un correo a `CONTACT_TO_EMAIL` con asunto `[Arcade Vault] Mensaje de <nombre>` y el nombre, el correo y el mensaje en el cuerpo.
- [ ] Responder ese correo desde el buzón dirige la respuesta al correo escrito por el visitante (`replyTo`).
- [ ] Tras el envío exitoso se muestra la terminal `MENSAJE RECIBIDO … GRACIAS, <NOMBRE EN MAYÚSCULAS>`; "ENVIAR OTRO MENSAJE" devuelve el formulario con los campos vacíos.
- [ ] Mientras la acción está en curso, el botón está deshabilitado y muestra "ENVIANDO…"; no se puede enviar dos veces con doble clic.
- [ ] Con `RESEND_API_KEY` inválida o ausente, el formulario muestra un mensaje de error, conserva lo escrito y permite reintentar; el mensaje no contiene el texto del error de Resend.
- [ ] Un POST directo a la acción con un campo vacío, un correo inválido o un texto sobre el límite devuelve `invalid` y no envía ningún correo.
- [ ] Un envío con el campo `website` lleno muestra éxito pero no llega ningún correo.
- [ ] La clave de `RESEND_API_KEY` no aparece en `.next/static` ni en las respuestas de red del navegador.
- [ ] `.env` no aparece en `git status` y `git check-ignore .env` lo reporta como ignorado.
- [ ] `.env.example` está versionado (aparece en `git status` como nuevo), lista `RESEND_API_KEY`, `CONTACT_TO_EMAIL` y `CONTACT_FROM_EMAIL`, y no contiene ninguna clave ni correo reales.
- [ ] Recargar `/about` no produce advertencias de hidratación en la consola.
- [ ] Ninguna otra pantalla cambia visualmente.

---

## Decisiones tomadas y descartadas

- **Sí:** Server Action en `app/about/actions.ts`. Decisión del usuario; la clave queda en el servidor y Next 16 la recomienda para mutaciones propias. **No:** Route Handler (`app/api/contact/route.ts`), que añadiría una ruta pública sin otro consumidor.
- **Sí:** para pruebas, remitente `onboarding@resend.dev` y destinatario el correo personal del usuario en `CONTACT_TO_EMAIL`. Decisión del usuario. Funciona solo si ese correo es el de la cuenta de Resend. **No:** usar una dirección de Gmail como remitente: Resend exige un dominio verificado propio y no permite enviar desde dominios ajenos.
- **Sí:** remitente y destinatario en variables de entorno (`CONTACT_FROM_EMAIL`, `CONTACT_TO_EMAIL`), de modo que pasar a un remitente personalizado sea cambiar una variable cuando exista un dominio verificado. **No:** direcciones escritas en el código ni en esta spec, para no dejar el correo personal en el repositorio.
- **Sí:** un solo correo al equipo, con `replyTo` del visitante. Decisión del usuario. **No:** acuse de confirmación al visitante: duplica los envíos y permite usar el formulario para mandar correo a direcciones ajenas.
- **Sí:** revalidar en el servidor (campos, formato de correo y longitudes) y honeypot. Decisión del usuario. Las Server Actions se pueden llamar con un POST directo, así que la validación del cliente no basta. **No:** rate limiting ni captcha: requieren almacenamiento o servicios externos y merecen su propia spec.
- **Sí:** correo en texto plano. **No:** HTML ni React Email: el contenido es un mensaje de persona y el texto plano evita inyección de HTML.
- **Sí:** la acción devuelve un resultado tipado (`success` / `invalid` / `failed`) en lugar de lanzar. Permite mantener lo escrito en el formulario y mostrar un error sin pasar por un error boundary.
- **Sí:** mantener `validateContactMessage` en `lib/contact.ts` y usarla en cliente y servidor. **No:** duplicar las reglas en el componente y en la acción.
- **Sí:** los errores de Resend solo se registran en el servidor. **No:** mostrarlos al visitante, porque pueden revelar configuración interna.
- **Sí:** `.env` para los valores reales y `.env.example` versionado como plantilla. Decisión del usuario. Quien clone el repositorio ve qué variables necesita sin leer la spec. **Sí:** añadir `!.env.example` al `.gitignore`, porque `.env*` lo ignoraría. **No:** `.env.local`, descartado por el usuario.

---

## Riesgos identificados

| Riesgo | Mitigación |
| --- | --- |
| El correo de pruebas no es el de la cuenta de Resend y `onboarding@resend.dev` rechaza el envío | Registrar la cuenta de Resend con el mismo correo que `CONTACT_TO_EMAIL`; si falla, el formulario muestra el error y el detalle queda en el log del servidor. |
| Los correos de `onboarding@resend.dev` caen en spam | Aceptable para pruebas; se resuelve al verificar un dominio propio en otra spec. |
| La clave se filtra al navegador | Variables sin `NEXT_PUBLIC_`, lectura solo dentro de la acción y criterio de aceptación que revisa `.next/static`. |
| Un tercero llama a la acción en masa y consume la cuota de Resend | La validación y el honeypot frenan basura, no volumen; el rate limiting queda fuera y se asume el riesgo mientras el proyecto sea de pruebas. |
| `cacheComponents` o el modelo de renderizado de Next 16 cambian cómo se ejecuta la acción | Leer las guías de `node_modules/next/dist/docs/` antes de escribirla (inicio del plan). |
| Inyección de cabeceras vía el nombre en el asunto | Eliminar saltos de línea del nombre antes de armar el asunto; el cuerpo es texto plano. |

---

## Qué **no** entra en esta spec

- Dominio propio verificado y remitente personalizado.
- Correo de confirmación al visitante.
- Rate limiting, captcha o cualquier servicio externo adicional.
- Guardar los mensajes o mostrarlos en la app.
- Plantillas HTML, adjuntos o reintentos.
- Pruebas automatizadas.

Cada uno de estos puntos, si se aborda, va en su propia spec.
