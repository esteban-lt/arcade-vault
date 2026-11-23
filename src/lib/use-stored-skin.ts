"use client";

import { useCallback, useSyncExternalStore } from "react";
import { DEFAULT_SKIN_ID, readStoredSkinId, writeStoredSkinId, type SkinId } from "@/lib/games/shared/skins";

const SKIN_CHANGE_EVENT = "arcade-vault:skin-change";

function subscribe(onStoreChange: () => void): () => void {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(SKIN_CHANGE_EVENT, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(SKIN_CHANGE_EVENT, onStoreChange);
  };
}

function subscribeNever(): () => void {
  return () => {};
}

// The saved skin of a game. The server and the hydration pass see the default skin, so markup
// stays stable; `isReady` turns true once the client has read the real value.
export function useStoredSkin(gameId: string): {
  skinId: SkinId;
  setSkinId: (skinId: SkinId) => void;
  isReady: boolean;
} {
  const skinId = useSyncExternalStore(
    subscribe,
    () => readStoredSkinId(gameId),
    () => DEFAULT_SKIN_ID,
  );
  const isReady = useSyncExternalStore(
    subscribeNever,
    () => true,
    () => false,
  );

  const setSkinId = useCallback(
    (nextSkinId: SkinId) => {
      writeStoredSkinId(gameId, nextSkinId);
      // `storage` only fires in other tabs, so notify this one by hand.
      window.dispatchEvent(new Event(SKIN_CHANGE_EVENT));
    },
    [gameId],
  );

  return { skinId, setSkinId, isReady };
}
