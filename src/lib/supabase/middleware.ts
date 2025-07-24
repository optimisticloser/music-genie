import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PROTECTED_ROUTES = [
  "/dashboard",
  "/dashboard/history",
  "/dashboard/settings",
];

const AUTH_ROUTES = [
  "/login",
  "/signup",
  "/forgot-password",
];

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response = NextResponse.next({
              request: {
                headers: request.headers,
              },
            });
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // Don't interfere with auth callback
  if (request.nextUrl.pathname.startsWith('/auth/callback')) {
    return response;
  }

  const { data: { user } } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;

  if (!user && PROTECTED_ROUTES.some(route => path.startsWith(route))) {
    const redirectUrl = new URL('/login', request.url);
    return NextResponse.redirect(redirectUrl);
  }

  if (user && AUTH_ROUTES.some(route => path.startsWith(route))) {
    const redirectUrl = new URL('/dashboard', request.url);
    return NextResponse.redirect(redirectUrl);
  }

  return response;
} 