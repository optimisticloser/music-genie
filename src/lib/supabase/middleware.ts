import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PROTECTED_ROUTES = [
  "/dashboard",
  "/dashboard/new",
  "/dashboard/history",
  "/dashboard/settings",
  "/dashboard/discover",
  "/dashboard/radio",
  "/dashboard/generate",
  "/dashboard/search",
  "/dashboard/playlist",
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

  // Refreshing the auth token - this is the key part for session persistence
  await supabase.auth.getUser();

  // Only check auth for protected routes to avoid unnecessary session checks
  const path = request.nextUrl.pathname;
  const isProtectedRoute = PROTECTED_ROUTES.some(route => path.startsWith(route));
  const isAuthRoute = AUTH_ROUTES.some(route => path.startsWith(route));

  if (isProtectedRoute || isAuthRoute) {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user && isProtectedRoute) {
      const redirectUrl = new URL('/login', request.url);
      return NextResponse.redirect(redirectUrl);
    }

    if (user && isAuthRoute) {
      const redirectUrl = new URL('/dashboard/new', request.url);
      return NextResponse.redirect(redirectUrl);
    }
  }

  return response;
} 