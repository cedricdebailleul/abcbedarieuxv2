import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const url = request.url;

  // Bloquer UNIQUEMENT les requêtes Google Photos problématiques, pas toute l'API Maps
  if (url.includes('maps.googleapis.com/maps/api/place/js/PhotoService') ||
      url.includes('maps.googleapis.com/maps/api/place/photo')) {

    console.log('🚫 Blocked Google Photos request:', url);

    // Rediriger vers un placeholder au lieu de laisser l'erreur 403
    return NextResponse.redirect(
      new URL('https://via.placeholder.com/400x300/e5e7eb/6b7280?text=Image+bloquee', request.url)
    );
  }

  // Créer la réponse avec headers de sécurité renforcés
  const response = NextResponse.next();

  // Headers de sécurité essentiels
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-XSS-Protection', '1; mode=block');

  // Permissions Policy - restreindre l'accès aux APIs sensibles
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(self), payment=()'
  );

  // Content Security Policy (CSP)
  // DÉSACTIVÉ TEMPORAIREMENT - Google Maps a besoin de permissions très larges
  // TODO: Réactiver avec une configuration plus permissive pour Maps

  // const cspDirectives = [
  //   "default-src 'self'",
  //   "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://maps.googleapis.com https://maps.gstatic.com https://accounts.google.com *.google.com",
  //   "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://maps.googleapis.com",
  //   "img-src 'self' data: https: blob: https://*.googleapis.com https://*.gstatic.com https://*.google.com https://*.ggpht.com",
  //   "font-src 'self' data: https://fonts.gstatic.com",
  //   "connect-src 'self' https://maps.googleapis.com https://*.googleapis.com https://accounts.google.com",
  //   "frame-src 'self' https://accounts.google.com",
  //   "worker-src 'self' blob:",
  //   "child-src 'self' blob:",
  //   "object-src 'none'",
  //   "base-uri 'self'",
  //   "form-action 'self'",
  //   "frame-ancestors 'none'"
  // ];

  // if (process.env.NODE_ENV === 'production') {
  //   cspDirectives.push("upgrade-insecure-requests");
  // }

  // response.headers.set('Content-Security-Policy', cspDirectives.join('; '));

  // HSTS - Force HTTPS (seulement en production)
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  }

  return response;
}

export const config = {
  // Appliquer le middleware à toutes les routes
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};