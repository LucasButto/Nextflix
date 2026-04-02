import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { type NextRequest, NextResponse } from "next/server";

const intlMiddleware = createMiddleware(routing);

const PROTECTED_ROUTES = ["/my-list"];
const OG_IMAGE_PATTERN =
  /\/(opengraph-image|twitter-image)(\.png|\.jpg|\.jpeg)?$/;
const LOCALE_PREFIX = /^\/[a-z]{2}(\/|$)/;

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // OG image routes: manejar manualmente para evitar redirects basados en cookie
  if (OG_IMAGE_PATTERN.test(pathname)) {
    if (LOCALE_PREFIX.test(pathname)) {
      // Ya tiene prefijo de locale (/en/...) → pasar directo
      return NextResponse.next();
    }
    // Sin prefijo = locale por defecto (es) → rewrite interno a /es/...
    const url = request.nextUrl.clone();
    url.pathname = `/es${pathname}`;
    return NextResponse.rewrite(url);
  }

  // Quitar prefijo de locale para comparar ruta protegida
  const pathnameWithoutLocale = pathname.replace(/^\/[a-z]{2}(?=\/|$)/, "");

  const isProtected = PROTECTED_ROUTES.some(
    (route) =>
      pathnameWithoutLocale === route ||
      pathnameWithoutLocale.startsWith(route + "/"),
  );

  if (isProtected && !request.cookies.get("nextflix_auth")?.value) {
    const loginUrl = new URL("/", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
