export type SessionUser = {
  name: string;
};

export const SESSION_STORAGE_KEY = "arcade-vault:user";

export function readStoredSessionUser(): SessionUser | null {
  try {
    const rawValue = window.localStorage.getItem(SESSION_STORAGE_KEY);
    if (!rawValue) return null;
    const parsedValue: unknown = JSON.parse(rawValue);
    if (
      typeof parsedValue === "object" &&
      parsedValue !== null &&
      "name" in parsedValue &&
      typeof parsedValue.name === "string"
    ) {
      return { name: parsedValue.name };
    }
    return null;
  } catch {
    return null;
  }
}

export function storeSessionUser(user: SessionUser | null): void {
  try {
    if (user) {
      window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(user));
    } else {
      window.localStorage.removeItem(SESSION_STORAGE_KEY);
    }
  } catch {
    // localStorage unavailable (e.g. private mode): the session lives in memory only.
  }
}
