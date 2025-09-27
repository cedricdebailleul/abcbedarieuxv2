"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

export default function OAuthSuccessPage() {
  const searchParams = useSearchParams();
  const googleEmail = searchParams.get("google_email");

  useEffect(() => {
    // Envoyer un message au parent window et fermer la popup
    if (window.opener) {
      window.opener.postMessage({
        type: "GOOGLE_DRIVE_AUTH_SUCCESS",
        googleEmail
      }, window.location.origin);
    }
    
    // Fermer la fenêtre popup après un court délai
    setTimeout(() => {
      window.close();
    }, 1000);
  }, [googleEmail]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-green-50">
      <div className="text-center p-8">
        <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-xl font-semibold text-green-900 mb-2">
          ✅ Google Drive connecté avec succès!
        </h1>
        <p className="text-green-700 text-sm mb-4">
          Compte: {googleEmail}
        </p>
        <p className="text-green-600 text-xs">
          Cette fenêtre va se fermer automatiquement...
        </p>
      </div>
    </div>
  );
}