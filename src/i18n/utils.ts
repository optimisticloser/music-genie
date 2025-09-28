import {locales} from "./routing";

export function stripLocaleFromPath(pathname: string | null | undefined): string {
  if (!pathname) {
    return "";
  }

  const segments = pathname.split("/").filter(Boolean);
  if (segments.length && (locales as readonly string[]).includes(segments[0]!)) {
    const remainder = segments.slice(1).join("/");
    return remainder ? `/${remainder}` : "/";
  }

  return pathname;
}
