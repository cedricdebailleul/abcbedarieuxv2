import { NextRequest, NextResponse } from 'next/server';

/**
 * API pour rafraîchir le cache Open Graph de Facebook
 * Usage: POST /api/og-refresh { "url": "https://example.com/page" }
 */
export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();
    
    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' }, 
        { status: 400 }
      );
    }

    // Appel à l'API Facebook Graph pour rafraîchir le cache Open Graph
    const facebookUrl = `https://graph.facebook.com/v18.0/?id=${encodeURIComponent(url)}&scrape=true`;
    
    const response = await fetch(facebookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      return NextResponse.json({ 
        success: true, 
        message: 'Open Graph cache refreshed successfully',
        data 
      });
    } else {
      return NextResponse.json({ 
        success: false, 
        message: 'Failed to refresh Open Graph cache',
        status: response.status 
      });
    }
  } catch (error) {
    console.error('Error refreshing Open Graph cache:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}

/**
 * Endpoint pour tester les métadonnées Open Graph d'une URL
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const url = searchParams.get('url');
  
  if (!url) {
    return NextResponse.json(
      { error: 'URL parameter is required' }, 
      { status: 400 }
    );
  }

  try {
    // Récupérer la page et extraire les métadonnées
    const response = await fetch(url);
    const html = await response.text();
    
    // Extraire les balises Open Graph
    const ogTags: Record<string, string> = {};
    const ogRegex = /<meta\s+property="og:([^"]+)"\s+content="([^"]*)"[^>]*>/gi;
    let match;
    
    while ((match = ogRegex.exec(html)) !== null) {
      ogTags[match[1]] = match[2];
    }
    
    // Extraire les balises Twitter
    const twitterTags: Record<string, string> = {};
    const twitterRegex = /<meta\s+name="twitter:([^"]+)"\s+content="([^"]*)"[^>]*>/gi;
    
    while ((match = twitterRegex.exec(html)) !== null) {
      twitterTags[match[1]] = match[2];
    }

    return NextResponse.json({
      url,
      openGraph: ogTags,
      twitter: twitterTags,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching metadata:', error);
    return NextResponse.json(
      { error: 'Failed to fetch metadata' }, 
      { status: 500 }
    );
  }
}