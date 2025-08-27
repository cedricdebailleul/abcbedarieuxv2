"use client";

import { useEffect, useState } from "react";
import { MapPin, Loader2 } from "lucide-react";
import { env } from "@/lib/env";

interface PlaceFormMapProps {
  latitude?: number;
  longitude?: number;
  address?: string;
  onCoordinatesChange: (lat: number, lng: number) => void;
  className?: string;
}

let mapCounter = 0;

export function PlaceFormMap({
  latitude,
  longitude, 
  address,
  onCoordinatesChange,
  className = "",
}: PlaceFormMapProps) {
  const [mapId] = useState(() => `map-${++mapCounter}-${Date.now()}`);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState<string>('');
  const [debugInfo, setDebugInfo] = useState<string>('Initialisation...');

  useEffect(() => {
    const initializeMap = async () => {
      try {
        setStatus('loading');
        setDebugInfo('Recherche du conteneur par ID...');
        
        // Attendre que l'élément soit dans le DOM
        let retries = 0;
        let mapContainer: HTMLElement | null = null;
        
        while (!mapContainer && retries < 50) {
          mapContainer = document.getElementById(mapId);
          if (!mapContainer) {
            retries++;
            setDebugInfo(`Recherche conteneur... (${retries}/50)`);
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }
        
        if (!mapContainer) {
          throw new Error('Conteneur avec ID non trouvé après 5 secondes');
        }
        
        setDebugInfo('Conteneur trouvé ! Chargement Google Maps...');
        
        // Charger Google Maps si nécessaire
        if (!window.google) {
          setDebugInfo('Chargement du script Google Maps...');
          
          const script = document.createElement('script');
          script.src = `https://maps.googleapis.com/maps/api/js?key=${env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`;
          script.async = true;
          
          await new Promise<void>((resolve, reject) => {
            const timeout = setTimeout(() => {
              reject(new Error('Timeout Google Maps'));
            }, 15000);
            
            script.onload = () => {
              clearTimeout(timeout);
              resolve();
            };
            script.onerror = () => {
              clearTimeout(timeout);
              reject(new Error('Erreur chargement Google Maps'));
            };
            document.head.appendChild(script);
          });
        }
        
        setDebugInfo('Création de la carte...');
        
        const center = (latitude && longitude) 
          ? { lat: latitude, lng: longitude }
          : { lat: 43.6108, lng: 3.1612 };

        const map = new google.maps.Map(mapContainer, {
          zoom: (latitude && longitude) ? 16 : 13,
          center: center,
        });

        const marker = new google.maps.Marker({
          position: center,
          map: map,
          draggable: true,
        });

        marker.addListener("dragend", () => {
          const pos = marker.getPosition();
          if (pos) {
            onCoordinatesChange(pos.lat(), pos.lng());
          }
        });

        map.addListener("click", (e: google.maps.MapMouseEvent) => {
          if (e.latLng) {
            marker.setPosition(e.latLng);
            onCoordinatesChange(e.latLng.lat(), e.latLng.lng());
          }
        });

        setDebugInfo('Carte prête !');
        setStatus('ready');

      } catch (err) {
        console.error('Erreur carte:', err);
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
        setStatus('error');
      }
    };

    // Petit délai pour s'assurer que le DOM est prêt
    setTimeout(initializeMap, 50);
  }, [mapId]); // Dépendance sur mapId uniquement

  if (status === 'error') {
    return (
      <div className={`space-y-3 ${className}`}>
        <div className="w-full h-64 rounded-lg border border-red-300 bg-red-50 flex items-center justify-center">
          <div className="text-center">
            <MapPin className="w-8 h-8 text-red-400 mx-auto mb-2" />
            <p className="text-sm text-red-600">Erreur: {error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'loading') {
    return (
      <div className={`space-y-3 ${className}`}>
        <div className="w-full h-64 rounded-lg border border-gray-300 bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-2" />
            <p className="text-sm text-gray-600">Chargement de la carte...</p>
            <p className="text-xs text-gray-500 mt-2">🔍 {debugInfo}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <div
        id={mapId}
        className="w-full h-64 rounded-lg border border-gray-300"
      />
      <div className="text-xs text-gray-500 text-center">
        <p>💡 Cliquez sur la carte ou glissez le marqueur pour ajuster la position</p>
        {address && <p className="mt-1">📍 {address}</p>}
        {(latitude && longitude) && (
          <p className="text-xs text-gray-600 mt-1">
            Position: {latitude.toFixed(6)}, {longitude.toFixed(6)}
          </p>
        )}
      </div>
    </div>
  );
}