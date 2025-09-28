const DEFAULT_MARKET = "US";

const LOCALE_MARKET_MAP: Record<string, string> = {
  en: "US",
  "pt-br": "BR",
};

export function localeToMarket(
  locale?: string | null,
  explicitMarket?: string | null
): string {
  if (explicitMarket && explicitMarket.trim().length > 0) {
    return explicitMarket.trim().toUpperCase();
  }

  if (!locale || locale.trim().length === 0) {
    return DEFAULT_MARKET;
  }

  const normalized = locale.toLowerCase();

  if (LOCALE_MARKET_MAP[normalized]) {
    return LOCALE_MARKET_MAP[normalized];
  }

  if (normalized.includes("-")) {
    const [, region] = normalized.split("-");
    if (region) {
      return region.toUpperCase();
    }
  }

  return normalized.length === 2 ? normalized.toUpperCase() : DEFAULT_MARKET;
}

export const SUPPORTED_LOCALES = ["en", "pt-BR"] as const;
export const SUPPORTED_MARKETS = ["US", "BR"] as const;
