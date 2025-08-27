"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin, Loader2 } from "lucide-react";
import { env } from "@/lib/env";

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
  const mapRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState<string>('');
  const [debugInfo, setDebugInfo] = useState<string>('Initialisation...');
  const isInitialized = useRef(false);

  useEffect(() => {
    if (isInitialized.current) return;

    const initializeMap = async () => {
      try {
        setStatus('loading');
        setDebugInfo('Vérification du conteneur...');
        
        // Attendre que la ref soit attachée avec un timeout
        let retries = 0;
        const checkContainer = () => {
          if (mapRef.current) {
            proceedWithMap();
          } else if (retries < 50) { // Max 5 secondes d'attente
            retries++;
            setDebugInfo(`Attente du conteneur DOM... (${retries}/50)`);
            setTimeout(checkContainer, 100);
          } else {
            throw new Error('Timeout: Conteneur DOM introuvable après 5 secondes');
          }
        };

        const proceedWithMap = async () => {
          setDebugInfo('Conteneur trouvé ! Vérification de Google Maps...');
          
          // Charger l'API Google Maps directement
          if (!window.google) {
            setDebugInfo('Chargement du script Google Maps...');
            
            const script = document.createElement('script');
            script.src = `https://maps.googleapis.com/maps/api/js?key=${env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=marker`;
            script.async = true;
            script.defer = true;
            
            await new Promise<void>((resolve, reject) => {
              const timeout = setTimeout(() => {
                reject(new Error('Timeout: Google Maps failed to load'));
              }, 10000); // 10 secondes timeout
              
              script.onload = () => {
                clearTimeout(timeout);
                setDebugInfo('Script Google Maps chargé !');
                resolve();
              };
              script.onerror = () => {
                clearTimeout(timeout);
                reject(new Error('Failed to load Google Maps script'));
              };
              document.head.appendChild(script);
            });
          } else {
            setDebugInfo('Google Maps déjà disponible !');
          }

          setDebugInfo('Création de la carte...');
          
          // Position par défaut ou actuelle
          const center = (latitude && longitude) 
            ? { lat: latitude, lng: longitude }
            : { lat: 43.6108, lng: 3.1612 };

          // Créer la carte
          const map = new google.maps.Map(mapRef.current!, {
            zoom: (latitude && longitude) ? 16 : 13,
            center: center,
            gestureHandling: "cooperative",
            zoomControl: true,
            mapTypeControl: false,
            scaleControl: true,
            streetViewControl: false,
            rotateControl: false,
            fullscreenControl: false,
          });

          setDebugInfo('Création du marker...');

          // Créer le marker
          const marker = new google.maps.Marker({
            position: center,
            map: map,
            title: "Position de l'établissement",
            draggable: true,
          });

          // Événements
          marker.addListener("dragend", () => {
            const position = marker.getPosition();
            if (position) {
              onCoordinatesChange(position.lat(), position.lng());
            }
          });

          map.addListener("click", (event: google.maps.MapMouseEvent) => {
            if (event.latLng) {
              marker.setPosition(event.latLng);
              onCoordinatesChange(event.latLng.lat(), event.latLng.lng());
            }
          });

          setDebugInfo('Carte prête !');
          setStatus('ready');
          isInitialized.current = true;
        };

        // Démarrer la vérification du conteneur
        checkContainer();

      } catch (err) {
        console.error('Erreur carte:', err);
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
        setStatus('error');
      }
    };

    initializeMap();
  }, []); // Aucune dépendance

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
        ref={mapRef}
        className="w-full h-64 rounded-lg border border-gray-300"
      />
      <div className="text-xs text-gray-500 text-center">
        <p>💡 Cliquez sur la carte ou glissez le marqueur rouge pour ajuster la position</p>
        {address && (
          <p className="mt-1">📍 {address}</p>
        )}
        {(latitude && longitude) && (
          <div className="mt-2 text-xs text-gray-600">
            <p>📍 Position: {latitude.toFixed(6)}, {longitude.toFixed(6)}</p>
          </div>
        )}
      </div>
    </div>
  );
}