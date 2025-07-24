import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

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
    
    const response = NextResponse.redirect(`${origin}/dashboard`);
    
    // Set the session cookie manually if needed
    if (data.session) {
      response.cookies.set('sb-access-token', data.session.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });
      
      response.cookies.set('sb-refresh-token', data.session.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });
    }
    
    return response;

  } catch (error) {
    console.error("❌ Unexpected error in auth callback:", error);
    return NextResponse.redirect(`${origin}/auth/auth-code-error?error=unexpected`);
  }
} 