import {createServerClient} from "@supabase/ssr";
import {NextResponse, type NextRequest} from "next/server";
import {defaultLocale, locales} from "@/i18n/routing";

type AppLocale = (typeof locales)[number];

const SUPPORTED_LOCALES = locales as ReadonlyArray<AppLocale>;

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

const AUTH_ROUTES = ["/login", "/signup", "/forgot-password"];

type ParsedPath = {
  locale: AppLocale;
  pathname: string;
};

function isSupportedLocale(locale: string): locale is AppLocale {
  return SUPPORTED_LOCALES.includes(locale as AppLocale);
}

function parseLocale(pathname: string): ParsedPath {
  const segments = pathname.split("/").filter(Boolean);
  const potentialLocale = segments[0];

  if (potentialLocale && isSupportedLocale(potentialLocale)) {
    const pathWithoutLocale = `/${segments.slice(1).join("/")}`;
    return {
      locale: potentialLocale,
      pathname: pathWithoutLocale === "/" ? "/" : pathWithoutLocale,
    };
  }

  return { locale: defaultLocale as AppLocale, pathname: pathname || "/" };
}

export async function updateSession(
  request: NextRequest,
  response?: NextResponse
) {
  const { locale, pathname } = parseLocale(request.nextUrl.pathname);

  const nextResponse =
    response ??
    NextResponse.next({
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
            nextResponse.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  if (pathname.startsWith("/auth/callback")) {
    return nextResponse;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const requiresAuth = PROTECTED_ROUTES.some((route) =>
    pathname === route || pathname.startsWith(`${route}/`)
  );

  if (!user && requiresAuth) {
    const redirectUrl = new URL(`/${locale}/login`, request.url);
    return NextResponse.redirect(redirectUrl);
  }

  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));
  if (user && isAuthRoute) {
    const redirectUrl = new URL(`/${locale}/dashboard/generate`, request.url);
    return NextResponse.redirect(redirectUrl);
  }

  return nextResponse;
}
