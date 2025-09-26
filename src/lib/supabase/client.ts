import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

export const SUPABASE_CONFIG_ERROR_MESSAGE =
  "Supabase client is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your environment.";

let browserClient: SupabaseClient<Database> | null = null;

export default function createClient(): SupabaseClient<Database> | null {
  if (browserClient) {
    return browserClient;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    if (typeof window !== "undefined") {
      const missing: string[] = [];

      if (!url) {
        missing.push("NEXT_PUBLIC_SUPABASE_URL");
      }

      if (!anonKey) {
        missing.push("NEXT_PUBLIC_SUPABASE_ANON_KEY");
      }

      console.warn(
        `${SUPABASE_CONFIG_ERROR_MESSAGE} Missing variables: ${missing.join(", ")}.`
      );
    }

    return null;
  }

  browserClient = createBrowserClient<Database, "public", Database["public"]>(url, anonKey);
  return browserClient;
}
