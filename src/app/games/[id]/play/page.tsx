import { notFound } from "next/navigation";
import { GamePlayer } from "@/components/game-player";
import { findGameById, GAMES } from "@/lib/games";

export function generateStaticParams() {
  return GAMES.map((game) => ({ id: game.id }));
}

export default async function GamePlayPage(props: PageProps<"/games/[id]/play">) {
  const { id } = await props.params;
  const game = findGameById(id);
  if (!game) notFound();

  return <GamePlayer gameId={game.id} gameTitle={game.title} />;
}
