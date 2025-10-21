import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let supabaseClient: SupabaseClient<Database> | null = null;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "Supabase credentials are missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to enable Supabase features."
  );
} else {
  supabaseClient = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: "music-genie-auth",
      storage: typeof window !== "undefined" ? window.localStorage : undefined,
      flowType: 'pkce',
      debug: process.env.NODE_ENV === 'development',
    },
  });
}

export const supabase = supabaseClient;

export default function createClient(): SupabaseClient<Database> | null {
  return supabaseClient;
}
