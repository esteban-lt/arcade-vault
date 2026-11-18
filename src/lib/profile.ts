export const USERNAME_LIMITS = { minLength: 3, maxLength: 20 } as const;

// Mirrors the profiles_username_format check constraint in the database.
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
