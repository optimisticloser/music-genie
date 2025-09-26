import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

let browserClient: SupabaseClient<Database> | null = null;

export default function createClient(): SupabaseClient<Database> {
  if (browserClient) {
    return browserClient;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const missing: string[] = [];

  if (!url) {
    missing.push("NEXT_PUBLIC_SUPABASE_URL");
  }

  if (!anonKey) {
    missing.push("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  if (missing.length > 0) {
    throw new Error(
      `Cannot create Supabase browser client because the following environment variables are missing: ${missing.join(
        ", "
      )}. Add them to your environment configuration to fix this error.`,
    );
  }

  browserClient = createBrowserClient<Database>(url, anonKey);
  return browserClient;
}
