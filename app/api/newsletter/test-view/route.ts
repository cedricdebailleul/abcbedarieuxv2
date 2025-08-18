import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const campaignId = searchParams.get('c') || 'test-campaign';
  const subscriberId = searchParams.get('s') || 'test-subscriber';

  const html = `
  <!DOCTYPE html>
  <html>
  <head>
    <title>Test Newsletter View</title>
    <style>
      body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
      .header { background: #3b82f6; color: white; padding: 20px; text-align: center; border-radius: 8px; }
      .content { background: #f8fafc; padding: 20px; margin: 20px 0; border-radius: 8px; }
      .success { color: #16a34a; font-weight: bold; }
    </style>
  </head>
  <body>
    <div class="header">
      <h1>🎉 Version Web Newsletter - Test</h1>
      <p>ABC Bédarieux</p>
    </div>
    
    <div class="content">
      <h2>✅ Le lien "Voir dans le navigateur" fonctionne !</h2>
      <p>Campagne ID: <code>${campaignId}</code></p>
      <p>Abonné ID: <code>${subscriberId}</code></p>
      
      <div style="background: white; padding: 15px; border-left: 4px solid #16a34a; margin: 20px 0;">
        <p class="success">✅ Tracking web fonctionnel</p>
        <p>Cette page confirme que le système de liens "Voir dans le navigateur" fonctionne correctement.</p>
      </div>
      
      <h3>🔧 Test avec vos vraies données :</h3>
      <p>URL format : <code>/api/newsletter/view/{campaignId}/{subscriberId}</code></p>
      
      <h3>📊 Avantages de la version web :</h3>
      <ul>
        <li>Tracking des ouvertures fiable (non bloqué par Gmail)</li>
        <li>Chargement complet des images</li>
        <li>Liens cliquables avec tracking précis</li>
        <li>Rendu parfait sur tous les navigateurs</li>
      </ul>
    </div>
  </body>
  </html>`;

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
    }
  });
}