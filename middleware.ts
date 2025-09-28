import {NextRequest, NextResponse} from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import {routing} from "@/i18n/routing";
import {updateSession} from "@/lib/supabase/middleware";

const intlMiddleware = createIntlMiddleware(routing);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Lista de rotas que devem ser redirecionadas para o locale padrão
  const protectedRoutes = [
    '/login',
    '/signup', 
    '/forgot-password',
    '/dashboard',
    '/dashboard/new',
    '/dashboard/generate',
    '/dashboard/search',
    '/dashboard/favorites',
    '/dashboard/settings',
    '/dashboard/discover',
    '/dashboard/radio',
    '/dashboard/history',
    '/help',
    '/contact',
    '/feedback',
    '/privacy',
    '/terms',
    '/cookies'
  ];

  // Verifica se a rota precisa de redirecionamento
  const needsRedirect = protectedRoutes.some(route => 
    pathname === route || pathname.startsWith(route + '/')
  );

  // Se precisa de redirecionamento e não tem locale, redireciona para o padrão
  if (needsRedirect && !pathname.startsWith('/en') && !pathname.startsWith('/pt-BR')) {
    const url = request.nextUrl.clone();
    url.pathname = `/en${pathname}`;
    return NextResponse.redirect(url);
  }

  // Aplica o middleware do next-intl
  const response = intlMiddleware(request);
  
  // Aplica o middleware do Supabase
  return updateSession(request, response);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
