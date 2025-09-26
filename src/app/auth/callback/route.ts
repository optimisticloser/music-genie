import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Session } from "@supabase/supabase-js";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  console.log("🔐 Auth callback called with code:", !!code);

  if (!code) {
    console.error("❌ No code provided in auth callback");
    return NextResponse.redirect(`${origin}/auth/auth-code-error?error=no_code`);
  }

  try {
    const cookieStore = await cookies();
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                cookieStore.set(name, value, options);
              });
            } catch (error) {
              console.error("Error setting cookies:", error);
            }
          },
        },
      }
    );

    console.log("✅ Supabase client created, exchanging code...");
    
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      console.error("❌ Error exchanging code for session:", exchangeError);
      return NextResponse.redirect(`${origin}/auth/auth-code-error?error=exchange_failed&description=${exchangeError.message}`);
    }

    if (!data.user) {
      console.error("❌ No user data after code exchange");
      return NextResponse.redirect(`${origin}/auth/auth-code-error?error=no_user`);
    }

    console.log("✅ Successfully authenticated user:", data.user.email);
    console.log("🔄 Redirecting to dashboard...");
    
    return NextResponse.redirect(`${origin}/dashboard`);

  } catch (error) {
    console.error("❌ Unexpected error in auth callback:", error);
    return NextResponse.redirect(`${origin}/auth/auth-code-error?error=unexpected`);
  }
}

export async function POST(request: Request) {
  try {
    const { event, session }: { event: string; session: Session | null } =
      await request.json();

    const cookieStore = await cookies();
    const response = NextResponse.json({ success: true });

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options);
            });
          },
        },
      }
    );

    if (event === "SIGNED_OUT") {
      await supabase.auth.signOut();
      return response;
    }

    if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
      if (!session) {
        return NextResponse.json({ error: "Missing session" }, { status: 400 });
      }

      const { error } = await supabase.auth.setSession(session);

      if (error) {
        console.error("❌ Error syncing session:", error.message);
        return NextResponse.json({ error: "Session sync failed" }, { status: 500 });
      }
    }

    return response;
  } catch (error) {
    console.error("❌ Unexpected error in auth callback POST:", error);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}