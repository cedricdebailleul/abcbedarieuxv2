"use client";

import { useEffect, useState, useMemo } from "react";
import { MapPin, Loader2 } from "lucide-react";
import { useGoogleMapsLoader } from "@/hooks/use-google-maps-loader";

interface PlaceFormMapFinalProps {
  initialLat: number;
  initialLng: number;
  onPositionChange: (lat: number, lng: number) => void;
}

export function PlaceFormMapFinal({
  initialLat,
  initialLng,
  onPositionChange,
}: PlaceFormMapFinalProps) {
  const { isLoaded, loadError } = useGoogleMapsLoader();
  const [isReady, setIsReady] = useState(false);
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
  const [markerInstance, setMarkerInstance] = useState<google.maps.marker.AdvancedMarkerElement | null>(null);
  
  // ID stable pour la carte
  const mapId = useMemo(() => `map-final-${Math.random().toString(36).substr(2, 9)}`, []);

  // Initialiser quand Google Maps est chargé
  useEffect(() => {
    if (!isLoaded || isReady || mapInstance) {
      console.log('PlaceFormMapFinal - Skipping init:', { isLoaded, isReady, hasMap: !!mapInstance });
      return;
    }
    
    console.log('PlaceFormMapFinal - Starting initialization...');
    
    const initMap = async () => {
      console.log('PlaceFormMapFinal - Looking for element with ID:', mapId);
      const mapElement = document.getElementById(mapId);
      
      if (!mapElement) {
        console.error('PlaceFormMapFinal - Map element not found:', mapId);
        return false;
      }
      
      console.log('PlaceFormMapFinal - Element found, creating map...');
      
      try {
        const center = { lat: initialLat, lng: initialLng };
        
        const map = new window.google.maps.Map(mapElement, {
          center,
          zoom: 16,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        });

        // Load the marker library
        const { AdvancedMarkerElement } = await window.google.maps.importLibrary("marker") as google.maps.MarkerLibrary;

        const marker = new AdvancedMarkerElement({
          position: center,
          map,
          gmpDraggable: true,
          title: "Glissez pour repositionner",
        });

        // Événements
        marker.addListener("dragend", (event: google.maps.MapMouseEvent) => {
          if (event.latLng) {
            const lat = event.latLng.lat();
            const lng = event.latLng.lng();
            onPositionChange(lat, lng);
          }
        });

        map.addListener("click", (event: google.maps.MapMouseEvent) => {
          if (event.latLng) {
            const lat = event.latLng.lat();
            const lng = event.latLng.lng();
            marker.position = { lat, lng };
            onPositionChange(lat, lng);
          }
        });

        setMapInstance(map);
        setMarkerInstance(marker);
        setIsReady(true);
        console.log('PlaceFormMapFinal - Map initialized successfully!');
        return true;
      } catch (error) {
        console.error('PlaceFormMapFinal - Error creating map:', error);
        return false;
      }
    };

    // Retry logic pour attendre le DOM
    let attempts = 0;
    const maxAttempts = 30;
    
    const tryInit = async () => {
      attempts++;
      console.log(`PlaceFormMapFinal - Attempt ${attempts}/${maxAttempts}`);
      
      try {
        await initMap();
        // Succès
        return;
      } catch (error) {
        console.error('PlaceFormMapFinal - Init error:', error);
      }
      
      if (attempts < maxAttempts) {
        setTimeout(tryInit, 100);
      } else {
        console.error('PlaceFormMapFinal - Failed to initialize after', maxAttempts, 'attempts');
        setIsReady(true); // Éviter le blocage
      }
    };

    // Démarrer après un petit délai
    setTimeout(tryInit, 100);
  }, [isLoaded, mapId, initialLat, initialLng, isReady, mapInstance, onPositionChange]); // Dépendances minimales pour éviter les re-initialisations

  // Mettre à jour la position du marqueur
  useEffect(() => {
    if (mapInstance && markerInstance) {
      const newPosition = { lat: initialLat, lng: initialLng };
      markerInstance.position = newPosition;
      mapInstance.setCenter(newPosition);
    }
  }, [initialLat, initialLng, mapInstance, markerInstance]);

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
          <p className="text-xs mt-1">ID: {mapId}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="bg-green-50 border border-green-200 rounded p-3 text-sm">
        <div className="flex items-start gap-2">
          <MapPin className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium text-green-900">🎉 Carte interactive prête !</p>
            <p className="text-green-700 text-xs">
              Cliquez ou glissez le marqueur pour repositionner
            </p>
          </div>
        </div>
      </div>
      
      <div
        id={mapId}
        className="w-full h-64 rounded-lg border shadow-sm"
        style={{ minHeight: '256px' }}
      />
      
      <div className="text-xs text-gray-500 text-center">
        📍 {initialLat.toFixed(6)}, {initialLng.toFixed(6)}
      </div>
    </div>
  );
}