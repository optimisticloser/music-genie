import {hasLocale, type Locale} from "next-intl";
import {getRequestConfig} from "next-intl/server";
import {routing} from "./routing";

export default getRequestConfig(async ({locale}) => {
  const supportedLocales = routing.locales as unknown as Locale[];

  if (!locale || !hasLocale(supportedLocales, locale)) {
    throw new Error(`Unknown locale: ${locale ?? "undefined"}`);
  }

  const messages = (await import(`./messages/${locale}.json`)).default;

  return {
    locale,
    messages,
  };
});
