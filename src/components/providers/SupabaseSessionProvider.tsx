"use client";

import { useEffect } from "react";
import { useLocale } from "next-intl";
import type { Session } from "@supabase/supabase-js";
import createClient from "@/lib/supabase/client";

async function syncServerSession(
  locale: string,
  event: string,
  session: Session | null
) {
  try {
    await fetch(`/${locale}/auth/callback`, {
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
  const locale = useLocale();

  useEffect(() => {
    const supabase = createClient();

    if (!supabase) {
      return;
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "INITIAL_SESSION") {
        syncServerSession(locale, session ? "SIGNED_IN" : "SIGNED_OUT", session);
        return;
      }

      if (
        event === "SIGNED_IN" ||
        event === "SIGNED_OUT" ||
        event === "TOKEN_REFRESHED"
      ) {
        syncServerSession(locale, event, session);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [locale]);

  return <>{children}</>;
}
