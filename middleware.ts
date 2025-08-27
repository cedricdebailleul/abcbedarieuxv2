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

  // Laisser passer toutes les autres requêtes Google Maps (JS API, etc.)
  return NextResponse.next();
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