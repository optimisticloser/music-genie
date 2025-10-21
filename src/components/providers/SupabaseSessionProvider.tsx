"use client";

import { useEffect } from "react";
import type { Session } from "@supabase/supabase-js";
import createClient from "@/lib/supabase/client";

async function syncServerSession(event: string, session: Session | null) {
  try {
    await fetch("/auth/callback", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "same-origin",
      body: JSON.stringify({ event, session }),
    });
  } catch (error) {
    console.error("Failed to sync auth session", error);
  }
}

export function SupabaseSessionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    const supabase = createClient();

    if (!supabase) {
      return;
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth state changed:", event, session?.user?.email);
      
      if (event === "INITIAL_SESSION") {
        syncServerSession(session ? "SIGNED_IN" : "SIGNED_OUT", session);
        return;
      }

      if (
        event === "SIGNED_IN" ||
        event === "SIGNED_OUT" ||
        event === "TOKEN_REFRESHED"
      ) {
        syncServerSession(event, session);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return <>{children}</>;
}
