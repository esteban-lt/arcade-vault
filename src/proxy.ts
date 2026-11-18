import { NextResponse, type NextRequest } from "next/server";
import { findGameById } from "@/lib/games";

const NOT_FOUND_PATH = "/not-found";

// With Cache Components, a notFound() call inside the page runs after the shell has
// been streamed, so the response keeps a 200 status. Checking the id here, before
// rendering starts, lets unknown games return a real 404.
export function proxy(request: NextRequest) {
  const [, , gameId] = request.nextUrl.pathname.split("/");

  if (!findGameById(gameId)) {
    return NextResponse.rewrite(new URL(NOT_FOUND_PATH, request.url), { status: 404 });
  }
}

export const config = {
  matcher: ["/games/:id", "/games/:id/play"],
};
