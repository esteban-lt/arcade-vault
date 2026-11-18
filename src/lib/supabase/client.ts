import { createBrowserClient } from "@supabase/ssr";

// Browser client for Client Components. Uses the publishable key, so access is
// governed by Row Level Security policies, never by the key itself.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
