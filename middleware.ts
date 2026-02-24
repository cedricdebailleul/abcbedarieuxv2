import { NextRequest, NextResponse } from "next/server";

const protectedPrefixes = ["/dashboard", "/api/admin"];
const publicPrefixes = [
  "/",
  "/login",
  "/register",
  "/api/auth",
  "/api/newsletter",
  "/api/places",
  "/_next",
  "/favicon.ico",
];

export default async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // Skip public routes
  if (publicPrefixes.some((prefix) => path === prefix || (prefix !== "/" && path.startsWith(prefix)))) {
    return NextResponse.next();
  }

  // Protect dashboard and admin API routes
  const isProtected = protectedPrefixes.some((prefix) => path.startsWith(prefix));

  if (isProtected) {
    const sessionCookie =
      req.cookies.get("better-auth.session_token") ||
      req.cookies.get("__Secure-better-auth.session_token");

    if (!sessionCookie) {
      if (path.startsWith("/api/")) {
        return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
      }
      return NextResponse.redirect(new URL("/login", req.nextUrl));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.svg$|.*\\.ico$).*)"],
};
