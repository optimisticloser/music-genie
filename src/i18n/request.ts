import {hasLocale, type Locale} from "next-intl";
import {getRequestConfig} from "next-intl/server";
import {routing} from "./routing";

export default getRequestConfig(async ({locale}) => {
  const supportedLocales = routing.locales as unknown as Locale[];

  // Fallback para locale undefined durante build estático
  const validLocale = locale && hasLocale(supportedLocales, locale) 
    ? locale 
    : routing.defaultLocale;

  const messages = (await import(`./messages/${validLocale}.json`)).default;

  return {
    locale: validLocale,
    messages,
    timeZone: "America/Sao_Paulo",
  };
});
