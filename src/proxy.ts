import { NextResponse, type NextRequest } from "next/server";
import { findGameById } from "@/lib/games";
import { updateSession } from "@/lib/supabase/proxy";

const NOT_FOUND_PATH = "/not-found";
const GAME_PATH_PATTERN = /^\/games\/([^/]+)(?:\/play)?\/?$/;

// With Cache Components, a notFound() call inside the page runs after the shell has
// been streamed, so the response keeps a 200 status. Checking the id here, before
// rendering starts, lets unknown games return a real 404.
function isUnknownGamePath(pathname: string): boolean {
  const gameId = GAME_PATH_PATTERN.exec(pathname)?.[1];
  return gameId !== undefined && !findGameById(gameId);
}

export async function proxy(request: NextRequest) {
  if (isUnknownGamePath(request.nextUrl.pathname)) {
    return NextResponse.rewrite(new URL(NOT_FOUND_PATH, request.url), { status: 404 });
  }

  // Every other request refreshes the Supabase session cookies.
  return updateSession(request);
}

export const config = {
  // All app routes except static files, image optimization, the favicon and public images.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
