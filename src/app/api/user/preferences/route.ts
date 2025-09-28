import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { locales, defaultLocale } from "@/i18n/routing";
import { localeToMarket } from "@/lib/locale";

const SUPPORTED_LOCALES = locales as readonly string[];
const SUPPORTED_MARKETS = ["US", "BR"] as const;

type SupportedMarket = (typeof SUPPORTED_MARKETS)[number];

type PreferencesPayload = {
  default_locale?: string;
  default_market?: string;
};

function normalizeLocale(locale?: string | null): string {
  if (!locale) {
    return defaultLocale;
  }

  if (SUPPORTED_LOCALES.includes(locale)) {
    return locale;
  }

  return defaultLocale;
}

function normalizeMarket(market?: string | null, locale?: string): string {
  if (market && SUPPORTED_MARKETS.includes(market.toUpperCase() as SupportedMarket)) {
    return market.toUpperCase();
  }

  return localeToMarket(locale, market);
}

async function getSupabase() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    }
  );
}

export async function GET() {
  const supabase = await getSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: preferences, error } = await supabase
    .from("user_preferences")
    .select("default_locale, default_market")
    .eq("user_id", user.id)
    .single();

  if (error) {
    console.error("Failed to load user preferences", error);
    return NextResponse.json({ error: "Failed to load preferences" }, { status: 500 });
  }

  const default_locale = preferences?.default_locale ?? defaultLocale;
  const default_market =
    preferences?.default_market ?? localeToMarket(preferences?.default_locale ?? defaultLocale);

  return NextResponse.json({ default_locale, default_market });
}

export async function POST(request: NextRequest) {
  const payload = (await request.json()) as PreferencesPayload;
  const supabase = await getSupabase();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const desiredLocale = normalizeLocale(payload.default_locale);
  const desiredMarket = normalizeMarket(payload.default_market, desiredLocale);

  const { error } = await supabase
    .from("user_preferences")
    .update({
      default_locale: desiredLocale,
      default_market: desiredMarket,
    })
    .eq("user_id", user.id);

  if (error) {
    console.error("Failed to update user preferences", error);
    return NextResponse.json({ error: "Failed to update preferences" }, { status: 500 });
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set("NEXT_LOCALE", desiredLocale, { path: "/" });
  response.cookies.set("APP_MARKET", desiredMarket, { path: "/" });

  return response;
}
