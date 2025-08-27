"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin, Loader2 } from "lucide-react";
import { useGoogleMapsLoader } from "@/hooks/use-google-maps-loader";

interface PlaceFormMapSimpleProps {
  initialLat: number;
  initialLng: number;
  onPositionChange: (lat: number, lng: number) => void;
}

export function PlaceFormMapSimple({
  initialLat,
  initialLng,
  onPositionChange,
}: PlaceFormMapSimpleProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [isReady, setIsReady] = useState(false);
  const mapInstance = useRef<google.maps.Map | null>(null);
  const markerInstance = useRef<google.maps.Marker | null>(null);
  
  const { isLoaded, loadError } = useGoogleMapsLoader();

  // Debug: surveiller le statut de chargement
  useEffect(() => {
    console.log('PlaceFormMapSimple - Status:', { isLoaded, loadError, isReady });
  }, [isLoaded, loadError, isReady]);

  // Debug: surveiller la disponibilité de mapRef
  useEffect(() => {
    console.log('PlaceFormMapSimple - mapRef status:', { hasMapRef: !!mapRef.current });
    if (mapRef.current) {
      console.log('PlaceFormMapSimple - mapRef element:', mapRef.current);
    }
  });

  // Initialiser UNIQUEMENT quand Google Maps est chargé
  useEffect(() => {
    console.log('PlaceFormMapSimple - useEffect triggered:', { isLoaded, isReady, hasMapRef: !!mapRef.current });
    
    if (!isLoaded) {
      console.log('PlaceFormMapSimple - API not loaded yet');
      return;
    }
    
    if (!mapRef.current) {
      console.log('PlaceFormMapSimple - Map ref not available');
      return;
    }
    
    if (isReady) {
      console.log('PlaceFormMapSimple - Already ready');
      return;
    }
    
    console.log('PlaceFormMapSimple - Starting initialization...');

    const initMap = () => {
      console.log('PlaceFormMapSimple - initMap start');
      const center = { lat: initialLat, lng: initialLng };
      console.log('PlaceFormMapSimple - center:', center);

      if (!window.google?.maps) {
        console.error('PlaceFormMapSimple - window.google.maps not available');
        return;
      }

      console.log('PlaceFormMapSimple - Creating map...');
      const map = new window.google.maps.Map(mapRef.current!, {
        zoom: 15,
        center: center,
      });

      console.log('PlaceFormMapSimple - Map created, creating marker...');
      const marker = new window.google.maps.Marker({
        position: center,
        map: map,
        draggable: true,
      });

      console.log('PlaceFormMapSimple - Marker created, adding events...');
      // Events
      marker.addListener("dragend", () => {
        const pos = marker.getPosition();
        if (pos) {
          onPositionChange(pos.lat(), pos.lng());
        }
      });

      map.addListener("click", (e: google.maps.MapMouseEvent) => {
        if (e.latLng) {
          marker.setPosition(e.latLng);
          onPositionChange(e.latLng.lat(), e.latLng.lng());
        }
      });

      console.log('PlaceFormMapSimple - Events added, finalizing...');
      mapInstance.current = map;
      markerInstance.current = marker;
      setIsReady(true);
      console.log('PlaceFormMapSimple - Map ready!');
    };

    // Attendre que mapRef soit disponible avec retry
    const checkMapRef = (attempt = 1) => {
      console.log(`PlaceFormMapSimple - checkMapRef attempt ${attempt}`);
      
      if (mapRef.current) {
        console.log('PlaceFormMapSimple - mapRef found, initializing...');
        try {
          initMap();
        } catch (error) {
          console.error("PlaceFormMapSimple - Erreur carte:", error);
          setIsReady(true); // Pour éviter le blocage
        }
      } else if (attempt < 20) { // Essayer pendant 2 secondes max
        console.log(`PlaceFormMapSimple - mapRef not ready, retrying in 100ms (attempt ${attempt}/20)`);
        setTimeout(() => checkMapRef(attempt + 1), 100);
      } else {
        console.error('PlaceFormMapSimple - mapRef never became available');
        setIsReady(true); // Pour éviter le blocage
      }
    };

    // Démarrer la vérification après un petit délai
    const timer = setTimeout(() => checkMapRef(), 50);
    return () => clearTimeout(timer);
  }, [isLoaded, initialLat, initialLng, onPositionChange]); // Dépendances complètes

  // Séparément, mettre à jour la position si elle change
  useEffect(() => {
    if (isReady && initialLat && initialLng && markerInstance.current && mapInstance.current) {
      const newPos = { lat: initialLat, lng: initialLng };
      markerInstance.current.setPosition(newPos);
      mapInstance.current.setCenter(newPos);
    }
  }, [initialLat, initialLng, isReady]);

  if (loadError) {
    return (
      <div className="h-64 bg-red-50 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <MapPin className="w-8 h-8 text-red-400 mx-auto mb-2" />
          <p className="text-sm text-red-600">Erreur: {loadError.message}</p>
        </div>
      </div>
    );
  }

  if (!isLoaded || !isReady) {
    return (
      <div className="h-64 bg-blue-50 rounded-lg flex items-center justify-center border-2 border-blue-300">
        <div className="text-center text-blue-600">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
          <p className="text-sm font-medium">
            {!isLoaded ? "Chargement API Google Maps..." : "Initialisation de la carte..."}
          </p>
          <p className="text-xs mt-1">
            Status: isLoaded={isLoaded.toString()}, isReady={isReady.toString()}
          </p>
          {loadError && (
            <p className="text-xs text-red-600 mt-1">Erreur: {loadError ? (loadError as Error).message : 'Erreur de chargement inconnue'}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm">
        <div className="flex items-start gap-2">
          <MapPin className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium text-blue-900">Carte interactive</p>
            <p className="text-blue-700 text-xs">
              Cliquez ou glissez le marqueur pour repositionner
            </p>
          </div>
        </div>
      </div>
      
      <div ref={mapRef} className="w-full h-64 rounded-lg border shadow-sm" />
      
      <div className="text-xs text-gray-500 text-center">
        📍 {initialLat.toFixed(6)}, {initialLng.toFixed(6)}
      </div>
    </div>
  );
}