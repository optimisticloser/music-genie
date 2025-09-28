import {defineRouting} from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "pt-BR"],
  defaultLocale: "en",
  localePrefix: "always",
  pathnames: {
    "/": "/",
    "/login": "/login",
    "/signup": "/signup",
    "/forgot-password": "/forgot-password",
    "/dashboard": "/dashboard",
    "/dashboard/new": "/dashboard/new",
    "/dashboard/generate": "/dashboard/generate",
    "/dashboard/search": "/dashboard/search",
    "/dashboard/favorites": "/dashboard/favorites",
    "/dashboard/settings": "/dashboard/settings",
    "/dashboard/playlist/[id]": "/dashboard/playlist/[id]",
    "/dashboard/discover": "/dashboard/discover",
    "/dashboard/radio": "/dashboard/radio",
    "/dashboard/history": "/dashboard/history",
    "/auth/callback": "/auth/callback",
    "/auth/auth-code-error": "/auth/auth-code-error",
    "/test-auth": "/test-auth",
    "/test-login": "/test-login",
    "/test-cover-generator": "/test-cover-generator",
    "/test-async-cover": "/test-async-cover",
    "/test-new-badge": "/test-new-badge",
    "/help": "/help",
    "/contact": "/contact",
    "/feedback": "/feedback",
    "/privacy": "/privacy",
    "/terms": "/terms",
    "/cookies": "/cookies"
  }
});

export const {locales, defaultLocale} = routing;
