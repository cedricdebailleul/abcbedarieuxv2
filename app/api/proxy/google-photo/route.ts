import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const photoUrl = searchParams.get('url');

  if (!photoUrl) {
    return NextResponse.json({ error: "URL manquante" }, { status: 400 });
  }

  try {
    // Décoder l'URL qui a été encodée
    const decodedUrl = decodeURIComponent(photoUrl);
    
    // Vérifier que c'est bien une URL Google Maps
    if (!decodedUrl.includes('maps.googleapis.com')) {
      throw new Error('URL non autorisée');
    }
    
    // Faire la requête vers Google Photos avec timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    const response = await fetch(decodedUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://maps.google.com/',
        'Accept': 'image/*,*/*;q=0.8',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`Google Photos API responded with ${response.status} for URL: ${decodedUrl}`);
      
      // Si l'image n'est pas accessible, retourner une image placeholder
      return NextResponse.redirect('https://via.placeholder.com/400x300/e5e7eb/6b7280?text=Image+non+disponible', 302);
    }

    const imageBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/jpeg';

    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400', // Cache 24h
        'Access-Control-Allow-Origin': '*',
        'Cross-Origin-Resource-Policy': 'cross-origin',
      },
    });

  } catch (error) {
    console.error('Erreur proxy Google Photo:', error);
    
    // Retourner une image placeholder au lieu d'une erreur JSON
    return NextResponse.redirect('https://via.placeholder.com/400x300/e5e7eb/6b7280?text=Image+non+disponible', 302);
  }
}