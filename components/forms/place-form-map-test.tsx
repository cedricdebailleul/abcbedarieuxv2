"use client";

import { useEffect, useState } from "react";
import { MapPin } from "lucide-react";

interface PlaceFormMapProps {
  latitude?: number;
  longitude?: number;
  address?: string;
  onCoordinatesChange: (lat: number, lng: number) => void;
  className?: string;
}

export function PlaceFormMap({
  latitude,
  longitude, 
  address,
  onCoordinatesChange,
  className = "",
}: PlaceFormMapProps) {
  const [domInfo, setDomInfo] = useState<string>('Initialisation...');
  const mapId = `test-map-${Date.now()}`;

  useEffect(() => {
    setDomInfo('Vérification du DOM...');
    
    const checkDOM = () => {
      const element = document.getElementById(mapId);
      if (element) {
        setDomInfo(`✅ Élément trouvé ! ID: ${mapId}`);
        
        // Test simple : changer la couleur de fond pour confirmer que ça marche
        element.style.backgroundColor = '#10b981';
        element.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: white; font-weight: bold;">🗺️ CARTE TEST RÉUSSIE !</div>';
        
        setTimeout(() => {
          onCoordinatesChange(43.628616, 3.163104); // Test de callback
          setDomInfo('✅ Callback testé !');
        }, 1000);
        
      } else {
        setDomInfo(`❌ Élément non trouvé. ID recherché: ${mapId}`);
        
        // Lister tous les éléments pour debug
        const allElements = document.querySelectorAll('div[id*="map"], div[id*="test"]');
        setDomInfo(`❌ Élément non trouvé. Autres éléments: ${allElements.length} trouvés`);
        
        setTimeout(checkDOM, 500);
      }
    };

    // Délai pour laisser le DOM se construire
    setTimeout(checkDOM, 100);
  }, [mapId, onCoordinatesChange]);

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="bg-blue-50 border border-blue-200 rounded p-2 text-xs">
        <strong>🔍 Test DOM:</strong> {domInfo}
      </div>
      
      <div
        id={mapId}
        className="w-full h-64 rounded-lg border-2 border-dashed border-gray-400 bg-gray-100 flex items-center justify-center"
      >
        <div className="text-center text-gray-600">
          <MapPin className="w-8 h-8 mx-auto mb-2" />
          <p className="text-sm">En attente de l&apos;initialisation...</p>
          <p className="text-xs">ID: {mapId}</p>
        </div>
      </div>
      
      <div className="text-xs text-gray-500 text-center space-y-1">
        <p>📍 Position actuelle: {latitude?.toFixed(6) || 'N/A'}, {longitude?.toFixed(6) || 'N/A'}</p>
        {address && <p>📍 {address}</p>}
      </div>
    </div>
  );
}